from flask import Blueprint, jsonify
import numpy as np
import cv2
import tensorflow as tf
import mediapipe as mp

import os
import json
import datetime
import random

predict_bp = Blueprint('predict', __name__)

MODEL_PATH = "backend/model/sign_language_model.h5"
LABELS_PATH = "backend/model/label_classes.npy"
model = tf.keras.models.load_model(MODEL_PATH)
labels = np.load(LABELS_PATH, allow_pickle=True)

AVAILABLE_LETTERS = ['A', 'B', 'C']
DAILY_FILE = "backend/data/daily_letters.json"

cap = cv2.VideoCapture(0)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.5,
                       min_tracking_confidence=0.5)

last_prediction = ""
correct_start_time = None


@predict_bp.route('/predict_current', methods=['GET'])
def predict_current():
    global last_prediction, correct_start_time

    success, frame = cap.read()
    if not success:
        return jsonify({"prediction": "None", "confirmed": False})

    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    prediction = "None"
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            points = []
            for lm in hand_landmarks.landmark:
                points.extend([lm.x, lm.y])
            while len(points) < 42:
                points.append(0.0)
            pred = model.predict(np.array([points], dtype=np.float32))
            prediction = labels[np.argmax(pred)]

    if prediction == last_prediction and prediction != "None":
        if correct_start_time is None:
            correct_start_time = cv2.getTickCount()
        else:
            elapsed = (cv2.getTickCount() - correct_start_time) / cv2.getTickFrequency()
            if elapsed >= 5:
                return jsonify({"prediction": prediction, "confirmed": True})
    else:
        last_prediction = prediction
        correct_start_time = None

    return jsonify({"prediction": prediction, "confirmed": False})


@predict_bp.route('/get_daily_letters', methods=['GET'])
def get_daily_letters():
    if not os.path.exists(DAILY_FILE):
        with open(DAILY_FILE, "w") as f:
            json.dump({}, f)

    with open(DAILY_FILE, "r+") as f:
        data = json.load(f)
        today = datetime.date.today().isoformat()
        if today not in data:
            shuffled = AVAILABLE_LETTERS.copy()
            random.shuffle(shuffled)
            data[today] = shuffled
            f.seek(0)
            json.dump(data, f)
            f.truncate()
        return jsonify({"letters": data[today]})




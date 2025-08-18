from flask import Blueprint, jsonify
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from utils.frame_handler import get_latest_frame


features_bp = Blueprint('features', __name__)

# ✅ Load Model
MODEL_PATH = "backend/model/sign_language_model.h5"
LABELS_PATH = "backend/model/label_classes.npy"
model = tf.keras.models.load_model(MODEL_PATH)
label_classes = np.load(LABELS_PATH, allow_pickle=True)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_draw = mp.solutions.drawing_utils

@features_bp.route('/predict_current', methods=['GET'])
def predict_current():
    try:
        frame = get_latest_frame()
        if frame is None:
            print("⚠️ No frame available")
            return jsonify({"predicted": "None", "confirmed": False})  # <-- changed key

        print("✅ Frame received for prediction")

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        if not results.multi_hand_landmarks:
            print("⚠️ No hand landmarks detected")
            return jsonify({"predicted": "None", "confirmed": False})  # <-- changed key

        for hand_landmarks in results.multi_hand_landmarks:
            data = []
            for lm in hand_landmarks.landmark:
                data.extend([lm.x, lm.y])
            while len(data) < 84:
                data.append(0.0)

            features = np.array(data).reshape(1, -1)

            prediction = model.predict(features)
            predicted_label = label_classes[np.argmax(prediction)]

            print("✅ Prediction:", predicted_label)

            return jsonify({"predicted": predicted_label, "confirmed": True})  # <-- changed key

        return jsonify({"predicted": "None", "confirmed": False})  # <-- changed key
    except Exception as e:
        print("❌ Error in predict_current:", str(e))
        return jsonify({"error": str(e)}), 500




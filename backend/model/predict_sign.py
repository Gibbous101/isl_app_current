import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import time
from flask import Flask, jsonify, Response

app = Flask(__name__)

MODEL_PATH = "model/sign_language_model.h5"
LABELS_PATH = "model/label_classes.npy"

model = tf.keras.models.load_model(MODEL_PATH)
label_classes = np.load(LABELS_PATH, allow_pickle=True)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

last_prediction = None
start_time = None
HOLD_TIME = 5
confirmed_letter = None

@app.route('/predict_current', methods=['GET'])
def predict_current():
    global confirmed_letter
    return jsonify({"predicted": confirmed_letter, "confirmed": confirmed_letter is not None})

def gen_frames():
    global last_prediction, start_time, confirmed_letter

    cap = cv2.VideoCapture(0)
    hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7, min_tracking_confidence=0.7)

    while True:
        success, frame = cap.read()
        if not success:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image)
        prediction = ""

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z])

                prediction = label_classes[np.argmax(model.predict([landmarks]))]

                # ✅ Draw black lines and red dots
                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=3, circle_radius=4),  # Red dots
                    mp_drawing.DrawingSpec(color=(0, 0, 0), thickness=2)  # Black lines
                )

        # ✅ 5-second hold detection
        if prediction:
            if prediction == last_prediction:
                if start_time and time.time() - start_time >= HOLD_TIME:
                    confirmed_letter = prediction
            else:
                last_prediction = prediction
                start_time = time.time()

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

@app.route('/game/practice/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

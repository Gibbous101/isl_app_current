from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import os
import mediapipe as mp
import tensorflow as tf

app = Flask(__name__)
CORS(app, origins=["*"])

# --------------------------------------------------------------
# Load model and labels
# --------------------------------------------------------------
MODEL_PATH  = "model/sign_language_model.h5"
LABELS_PATH = "model/label_classes.npy"

model = tf.keras.models.load_model(MODEL_PATH)
label_classes = np.load(LABELS_PATH, allow_pickle=True)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1,
                       min_detection_confidence=0.7,
                       min_tracking_confidence=0.7)

@app.route("/")
def home():
    return "ISL App Backend Running!"

# --------------------------------------------------------------
# Predict current frame (POST)
# --------------------------------------------------------------
@app.route("/predict_current", methods=["POST"])
def predict_current():
    try:
        data = request.json
        if "frame" not in data:
            return jsonify({"confirmed": False, "predicted": "None", "error": "No frame provided"})

        # Decode base64 to image
        img_data  = data["frame"].split(",")[1] if "," in data["frame"] else data["frame"]
        img_bytes = base64.b64decode(img_data)
        nparr     = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"confirmed": False, "predicted": "None", "error": "Invalid frame"})

        # NOTE: frame already 224x224 from frontend
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results   = hands.process(image_rgb)

        # Log whether Mediapipe detected a hand
        print("Hand detected:", bool(results.multi_hand_landmarks))

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z])

                prediction_index = np.argmax(model.predict([landmarks]))
                predicted_letter = str(label_classes[prediction_index])
                return jsonify({"confirmed": True, "predicted": predicted_letter})

        # No hand detected
        return jsonify({"confirmed": False, "predicted": "None"})

    except Exception as e:
        print("❌ Error in predict_current:", e)
        return jsonify({"confirmed": False, "predicted": "None", "error": str(e)})

# --------------------------------------------------------------
# Main
# --------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"✅ Flask server running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)

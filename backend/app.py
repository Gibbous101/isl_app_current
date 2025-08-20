from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import os
import tensorflow as tf

app = Flask(__name__)
CORS(app, origins=["*"])

# Load model and labels
MODEL_PATH  = "model/sign_language_model.h5"
LABELS_PATH = "model/label_classes.npy"

model = tf.keras.models.load_model(MODEL_PATH)
label_classes = np.load(LABELS_PATH, allow_pickle=True)

@app.route("/")
def home():
    return "ISL App Backend Running!"

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

        # Resize to 224x224 for the model and normalize if necessary
        img_resized = cv2.resize(frame, (224, 224))
        img_resized = img_resized.astype("float32") / 255.0
        img_resized = np.expand_dims(img_resized, axis=0)

        # Predict letter
        prediction_index = np.argmax(model.predict(img_resized))
        predicted_letter = str(label_classes[prediction_index])

        return jsonify({"confirmed": True, "predicted": predicted_letter})

    except Exception as e:
        print("❌ Error in predict_current:", e)
        return jsonify({"confirmed": False, "predicted": "None", "error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

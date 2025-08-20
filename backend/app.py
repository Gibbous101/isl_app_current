from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
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
        if "landmarks" not in data:
            return jsonify({"confirmed": False, "predicted": "None", "error": "No landmarks provided"})

        landmarks = np.array(data["landmarks"], dtype=np.float32)
        if landmarks.shape[0] != 63:  # 21 points * 3 coordinates
            return jsonify({"confirmed": False, "predicted": "None", "error": "Invalid landmarks length"})

        # Reshape for model: (1, 63)
        landmarks = np.expand_dims(landmarks, axis=0)

        prediction_index = np.argmax(model.predict(landmarks))
        predicted_letter = str(label_classes[prediction_index])

        return jsonify({"confirmed": True, "predicted": predicted_letter})

    except Exception as e:
        print("❌ Error in predict_current:", e)
        return jsonify({"confirmed": False, "predicted": "None", "error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

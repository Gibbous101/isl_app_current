# backend/predict_sign.py
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "sign_language_model.h5")
LABELS_PATH = os.path.join(BASE_DIR, "model", "label_classes.npy")

# Load model + labels
model = tf.keras.models.load_model(MODEL_PATH)
label_classes = np.load(LABELS_PATH, allow_pickle=True)

last_prediction = None
confirmed_letter = None

@app.route('/predict_frame', methods=['POST'])
def predict_frame():
    global confirmed_letter
    try:
        data = request.get_json()
        landmarks = np.array(data.get("landmarks"))  # frontend must send hand landmarks

        prediction = label_classes[np.argmax(model.predict([landmarks]))]
        confirmed_letter = prediction

        return jsonify({"predicted": prediction, "confirmed": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/predict_current', methods=['GET'])
def predict_current():
    return jsonify({
        "predicted": confirmed_letter,
        "confirmed": confirmed_letter is not None
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

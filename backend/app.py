# backend/app.py
import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "sign_language_model.h5")
LABELS_PATH = os.path.join(MODEL_DIR, "label_classes.npy")

# ---- load model & labels once at startup ----
try:
    app.logger.info("[boot] Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    label_classes = np.load(LABELS_PATH, allow_pickle=True)
    app.logger.info("[boot] Model and labels loaded OK")
except Exception as e:
    model = None
    label_classes = None
    app.logger.error(f"[boot] Failed to load model: {e}")

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "ok": True,
        "service": "isl-backend",
        "routes": ["/health", "/predict_frame"]
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": model is not None})

@app.route("/predict_frame", methods=["POST"])
def predict_frame():
    if model is None or label_classes is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.get_json(force=True) or {}
        arr = data.get("landmarks")
        if arr is None:
            return jsonify({"error": "No landmarks"}), 400

        x = np.array(arr, dtype=np.float32).reshape(1, -1)
        if x.shape[1] != 63:
            return jsonify({"error": f"Expected 63 values, got {x.shape[1]}"}), 400

        preds = model.predict(x, verbose=0)
        idx = int(np.argmax(preds, axis=1)[0])
        predicted = str(label_classes[idx])

        return jsonify({"predicted": predicted, "confirmed": True})
    except Exception as e:
        app.logger.exception("predict_frame error")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

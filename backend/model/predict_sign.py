# predict_sign.py
import numpy as np
import tensorflow as tf
import os
import sys
import traceback

# Paths
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "sign_language_model.h5")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "model", "label_classes.npy")

# Debug print function
def debug_log(message):
    print(f"[DEBUG] {message}", flush=True)

# Load model and labels
try:
    debug_log("Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    debug_log(f"Model loaded successfully from {MODEL_PATH}")

    debug_log("Loading label classes...")
    label_classes = np.load(LABELS_PATH, allow_pickle=True)
    debug_log(f"Labels loaded successfully: {label_classes}")

except Exception as e:
    debug_log("ERROR while loading model or labels")
    traceback.print_exc()
    model = None
    label_classes = []

def predict_sign(landmarks):
    """
    Predict sign from landmarks.
    """
    try:
        if model is None or len(label_classes) == 0:
            return {"error": "Model or labels not loaded"}

        debug_log(f"Raw landmarks input: {landmarks[:5]}... (len={len(landmarks)})")

        # Convert landmarks to numpy and reshape
        landmarks = np.array(landmarks).flatten()
        debug_log(f"After flatten: shape={landmarks.shape}")

        # Expand dims for model
        input_data = np.expand_dims(landmarks, axis=0)
        debug_log(f"After expand_dims: shape={input_data.shape}")

        # Run prediction
        preds = model.predict(input_data)
        debug_log(f"Model prediction: {preds}")

        predicted_class = label_classes[np.argmax(preds)]
        confidence = float(np.max(preds))

        debug_log(f"Predicted: {predicted_class}, Confidence: {confidence}")

        return {"prediction": str(predicted_class), "confidence": confidence}

    except Exception as e:
        debug_log("ERROR inside predict_sign")
        traceback.print_exc()
        return {"error": str(e), "traceback": traceback.format_exc()}

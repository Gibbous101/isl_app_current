from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import os

app = Flask(__name__)
CORS(app, origins=["*"])  # Allow all frontend calls for testing

# ------------------------------
# Root Route
# ------------------------------
@app.route("/")
def home():
    return "ISL App Backend Running!"
#change
# ------------------------------
# Predict Current Route
# ------------------------------
@app.route("/predict_current", methods=["POST"])
def predict_current():
    try:
        data = request.json
        if "frame" not in data:
            return jsonify({"confirmed": False, "predicted": "None", "error": "No frame provided"})

        # Decode base64 image from frontend
        img_data = data["frame"].split(",")[1] if "," in data["frame"] else data["frame"]
        img_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # TODO: Add your ML prediction here
        # For debug, return static letter
        predicted_letter = "C"

        return jsonify({"confirmed": True, "predicted": predicted_letter})
    except Exception as e:
        print("❌ Error in predict_current:", e)
        return jsonify({"confirmed": False, "predicted": "None", "error": str(e)})

# ------------------------------
# Predict Game Route
# ------------------------------
@app.route("/predict_game", methods=["POST"])
def predict_game():
    return jsonify({"confirmed": False, "prediction": "None"})

# ------------------------------
# Main
# ------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"✅ Flask server running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)

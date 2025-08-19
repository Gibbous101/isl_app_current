from flask import Flask, Response, jsonify, send_file
import os
import cv2

app = Flask(__name__)

# ------------------------------
# CORS Setup (allow your frontend)
# ------------------------------
from flask_cors import CORS
CORS(app, origins=["*"])  # allow all frontend calls for testing

# ------------------------------
# Paths
# ------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PLACEHOLDER_PATH = os.path.join(BASE_DIR, "placeholder.jpg")
TEST_VIDEO_PATH = os.path.join(BASE_DIR, "data", "test_video.mp4")

# ------------------------------
# Root Route
# ------------------------------
@app.route("/")
def home():
    return "ISL App Backend Running!"

# ------------------------------
# Video Feed Route (Render-safe)
# ------------------------------
@app.route("/video_feed")
def video_feed():
    try:
        # Use test video if exists
        if os.path.exists(TEST_VIDEO_PATH):
            cap = cv2.VideoCapture(TEST_VIDEO_PATH)
            ret, frame = cap.read()
            cap.release()
            if ret:
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    return Response(buffer.tobytes(), mimetype='image/jpeg')
        # Fallback to placeholder image
        return send_file(PLACEHOLDER_PATH, mimetype="image/jpeg")
    except Exception as e:
        print("❌ Error in video_feed:", e)
        return send_file(PLACEHOLDER_PATH, mimetype="image/jpeg")

# ------------------------------
# Predict Current Route
# ------------------------------
@app.route("/predict_current")
def predict_current():
    # Always return a static letter for Render-safe debug
    return jsonify({"confirmed": True, "predicted": "C"})

# ------------------------------
# Predict Game Route
# ------------------------------
@app.route("/predict_game")
def predict_game():
    return jsonify({"confirmed": False, "prediction": "None"})

# ------------------------------
# Main
# ------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"✅ Flask server running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)

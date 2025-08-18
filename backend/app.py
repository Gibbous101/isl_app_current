from flask import Flask, Response, jsonify, send_file
from threading import Thread
import os
import cv2
import time

app = Flask(__name__)

# ------------------------------
# CORS Setup (allow your frontend)
# ------------------------------
from flask_cors import CORS
CORS(app, origins=["https://isl-app-backend.onrender.com"])  # replace "*" with your frontend URL in production

# ------------------------------
# Global Variables
# ------------------------------
frame = None  # store the current frame

# ------------------------------
# Capture Frames (debug version)
# ------------------------------
def capture_frames():
    global frame
    try:
        # Check if running on Render
        if "RENDER" in os.environ:
            print("⚠️ Running on Render, using test video instead of webcam")
            cap = cv2.VideoCapture("data/test_video.mp4")  # provide a short test video in your project
        else:
            cap = cv2.VideoCapture(0)  # local webcam

        while True:
            ret, frame_read = cap.read()
            if not ret:
                print("⚠️ Frame not read correctly")
                time.sleep(0.1)
                continue
            frame = frame_read
            time.sleep(0.03)  # ~30 FPS
    except Exception as e:
        print("❌ Error in capture_frames:", e)

# ------------------------------
# Video Feed Route
# ------------------------------
@app.route("/video_feed")
def video_feed():
    global frame
    try:
        if frame is None:
            # Return placeholder image if no frame
            return send_file("placeholder.jpg", mimetype="image/jpeg")

        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            return send_file("placeholder.jpg", mimetype="image/jpeg")

        return Response(buffer.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        print("❌ Error in video_feed:", e)
        return send_file("placeholder.jpg", mimetype="image/jpeg")

# ------------------------------
# Predict Current (example)
# ------------------------------
@app.route("/predict_current")
def predict_current():
    # Demo: always return None if no frame
    global frame
    if frame is None:
        return jsonify({"confirmed": False, "predicted": "None"})

    # Here your actual ML prediction code can go
    predicted_letter = "C"  # placeholder
    return jsonify({"confirmed": True, "predicted": predicted_letter})

# ------------------------------
# Predict Game (example)
# ------------------------------
@app.route("/predict_game")
def predict_game():
    # Demo logic
    return jsonify({"confirmed": False, "prediction": "None"})

# ------------------------------
# Main
# ------------------------------
if __name__ == "__main__":
    # Start frame capture in background
    Thread(target=capture_frames, daemon=True).start()
    print("✅ Flask server running (deployed on Render)")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

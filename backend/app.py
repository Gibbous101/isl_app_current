from flask import Flask, Response, jsonify, send_file
import os
import cv2

app = Flask(__name__)

# ------------------------------
# CORS Setup (allow your frontend)
# ------------------------------
from flask_cors import CORS
CORS(app, origins=["https://isl-app-backend.onrender.com"])  # replace "*" with your frontend URL in production

# ------------------------------
# Video Feed Route (Render-safe)
# ------------------------------
@app.route("/video_feed")
def video_feed():
    """
    Returns a single frame for testing.
    Uses placeholder image or small test video.
    """
    try:
        # Check if test video exists
        video_path = "data/test_video.mp4"
        if os.path.exists(video_path):
            cap = cv2.VideoCapture(video_path)
            ret, frame = cap.read()
            cap.release()
            if ret:
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    return Response(buffer.tobytes(), mimetype='image/jpeg')
        
        # Fallback to placeholder image
        return send_file("placeholder.jpg", mimetype="image/jpeg")
    
    except Exception as e:
        print("❌ Error in video_feed:", e)
        return send_file("placeholder.jpg", mimetype="image/jpeg")

# ------------------------------
# Predict Current Route
# ------------------------------
@app.route("/predict_current")
def predict_current():
    """
    Returns a demo prediction.
    """
    # Replace with your ML code if needed
    predicted_letter = "C"  # placeholder
    return jsonify({"confirmed": True, "predicted": predicted_letter})

# ------------------------------
# Predict Game Route
# ------------------------------
@app.route("/predict_game")
def predict_game():
    """
    Returns a demo game prediction.
    """
    return jsonify({"confirmed": False, "prediction": "None"})

# ------------------------------
# Main
# ------------------------------
if __name__ == "__main__":
    print("✅ Flask server running (Render-safe debug mode)")
    # Standard Flask run (Render requires host 0.0.0.0 and port 5000)
    app.run(host="0.0.0.0", port=5000, debug=False)

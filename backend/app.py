import cv2
from flask import Flask, Response
from threading import Thread, Lock
from features.features_routes import features_bp
from features.predict_routes import predict_bp
from utils.frame_handler import set_latest_frame, get_latest_frame
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Register route blueprints
app.register_blueprint(features_bp)
app.register_blueprint(predict_bp)

# -- Camera Capture (single source for entire app) --
camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
lock = Lock()

def capture_frames():
    while True:
        success, frame = camera.read()
        if success:
            set_latest_frame(frame)

@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            frame = get_latest_frame()
            if frame is None:
                continue
            with lock:
                _, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    Thread(target=capture_frames, daemon=True).start()
    print("✅ Flask server running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

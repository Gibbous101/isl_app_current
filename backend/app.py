from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import cv2
from model.predict_sign import predict_sign

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Open webcam / Render will ignore, but we keep it
camera = cv2.VideoCapture(0)

current_target = "A"  # Default target for game mode


def generate_frames():
    """ Stream frames for practice mode """
    while True:
        success, frame = camera.read()
        if not success:
            break

        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")


@app.route("/video_feed")
def video_feed():
    """ Video stream route """
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/predict_current", methods=["POST"])
def predict_current():
    """
    Practice mode - predicts sign from uploaded frame
    """
    if "frame" not in request.files:
        return jsonify({"error": "No frame uploaded"}), 400

    file = request.files["frame"]
    file_bytes = file.read()
    np_arr = np.frombuffer(file_bytes, np.uint8)

    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    prediction = predict_sign(frame)

    if prediction is None:
        return jsonify({"confirmed": False, "predicted": "Detecting..."})
    return jsonify({"confirmed": True, "predicted": prediction})


@app.route("/predict_game", methods=["POST"])
def predict_game():
    """
    Game mode - predicts and checks against target letter
    """
    global current_target

    if "frame" not in request.files:
        return jsonify({"error": "No frame uploaded"}), 400

    file = request.files["frame"]
    file_bytes = file.read()
    np_arr = np.frombuffer(file_bytes, np.uint8)

    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    prediction = predict_sign(frame)

    if prediction is None:
        return jsonify({"confirmed": False, "prediction": "None"})

    confirmed = prediction == current_target
    return jsonify({"confirmed": confirmed, "prediction": prediction})


@app.route("/set_target", methods=["POST"])
def set_target():
    """
    Sets target letter for game mode
    """
    global current_target
    data = request.get_json()
    if "target" not in data:
        return jsonify({"error": "Target letter required"}), 400

    current_target = data["target"].upper()
    return jsonify({"message": f"Target set to {current_target}"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

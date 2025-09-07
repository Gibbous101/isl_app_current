# backend/app.py
import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import mediapipe as mp
import logging
import random
import datetime
import firebase_admin
from firebase_admin import credentials, firestore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Initialize Firebase Admin (serviceAccountKey.json must be in backend/)
if not firebase_admin._apps:
    cred = credentials.Certificate(os.path.join(BASE_DIR, "serviceAccountKey.json"))
    firebase_admin.initialize_app(cred)

db = firestore.client()

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---- Model setup ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "sign_language_model.h5")
LABELS_PATH = os.path.join(MODEL_DIR, "label_classes.npy")

try:
    logger.info("[boot] Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    label_classes = np.load(LABELS_PATH, allow_pickle=True)
    logger.info(f"[boot] Model and labels loaded OK. Classes: {label_classes}")
except Exception as e:
    model = None
    label_classes = None
    logger.error(f"[boot] Failed to load model: {e}")

# ---- MediaPipe hands setup ----
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,  # detect 2 hands
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# ---- Video capture ----
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    logger.error("Failed to open camera")

latest_landmarks = None  # store latest 63 landmarks
frame_count = 0

def generate_frames():
    global latest_landmarks, frame_count
    while True:
        success, img = cap.read()
        if not success:
            logger.warning("Failed to read frame from camera")
            break

        frame_count += 1
        
        # mirror the frame
        img = cv2.flip(img, 1)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        if results.multi_hand_landmarks:
            # Extract landmarks for both hands (up to 2 hands)
            all_landmarks = []
            
            # Process up to 2 hands
            for i in range(min(2, len(results.multi_hand_landmarks))):
                hand = results.multi_hand_landmarks[i]
                hand_landmarks = [coord for lm in hand.landmark for coord in (lm.x, lm.y, lm.z)]
                all_landmarks.extend(hand_landmarks)
            
            # If we have less than 2 hands, pad with zeros
            while len(all_landmarks) < 84:  # 2 hands × 21 landmarks × 3 coords = 126, but your model expects 84
                all_landmarks.append(0.0)
            
            # If we have more than expected, truncate
            latest_landmarks = all_landmarks[:84]
            
            # Log occasionally for debugging
            if frame_count % 100 == 0:
                logger.info(f"Hands detected: {len(results.multi_hand_landmarks)}, landmarks count: {len(latest_landmarks)}")
            
            # draw all hands
            for hand_lms in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(img, hand_lms, mp_hands.HAND_CONNECTIONS)
        else:
            latest_landmarks = None

        ret, buffer = cv2.imencode('.jpg', img)
        if not ret:
            logger.warning("Failed to encode frame")
            continue
            
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# ---- Routes ----
@app.route("/", methods=["GET"])
def root():
    # List all registered routes for debugging
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            "endpoint": rule.endpoint,
            "methods": list(rule.methods),
            "rule": str(rule)
        })
    
    return jsonify({
        "ok": True,
        "service": "isl-backend",
        "routes": ["/health", "/predict_frame", "/video_feed", "/latest_landmarks", "/test_prediction"],
        "model_loaded": model is not None,
        "camera_available": cap.isOpened(),
        "registered_routes": routes
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "ok": model is not None,
        "model_loaded": model is not None,
        "camera_available": cap.isOpened(),
        "landmarks_available": latest_landmarks is not None
    })

@app.route("/video_feed")
def video_feed():
    logger.info("Video feed requested")
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/latest_landmarks", methods=["GET"])
def latest_landmarks_route():
    global latest_landmarks
    if latest_landmarks:
        logger.debug(f"Returning {len(latest_landmarks)} landmarks")
        return jsonify({"landmarks": latest_landmarks})
    else:
        logger.debug("No landmarks available")
        return jsonify({"landmarks": []})

@app.route("/test_prediction", methods=["GET"])
def test_prediction():
    """Test endpoint to verify prediction works with dummy data"""
    if model is None or label_classes is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    # Create dummy landmarks (84 values for 2 hands)
    dummy_landmarks = [0.5] * 84  # All coordinates at center
    
    try:
        x = np.array(dummy_landmarks, dtype=np.float32).reshape(1, -1)
        preds = model.predict(x, verbose=0)
        confidence = float(np.max(preds))
        idx = int(np.argmax(preds, axis=1)[0])
        predicted = str(label_classes[idx])
        
        logger.info(f"Test prediction: {predicted} (confidence: {confidence:.3f})")
        
        return jsonify({
            "predicted": predicted,
            "confidence": confidence,
            "test": "dummy_landmarks",
            "model_input_shape": list(x.shape),
            "expected_input_size": 84,
            "all_predictions": preds.tolist()[0]
        })
    except Exception as e:
        logger.exception("test_prediction error")
        return jsonify({"error": str(e)}), 500
    
@app.route("/predict_frame", methods=["POST"])
def predict_frame():
    if model is None or label_classes is None:
        logger.error("Model not loaded")
        return jsonify({"error": "Model not loaded"}), 500

    try:
        # Log the raw request
        raw_data = request.get_data()
        logger.debug(f"Raw request data length: {len(raw_data)}")
        
        data = request.get_json(force=True) or {}
        arr = data.get("landmarks")
        
        logger.debug(f"Parsed JSON keys: {list(data.keys())}")
        logger.debug(f"Landmarks type: {type(arr)}, length: {len(arr) if arr else 'None'}")
        
        if arr is None:
            logger.warning("No landmarks provided in request")
            return jsonify({"error": "No landmarks provided"}), 400

        if not isinstance(arr, list):
            logger.warning(f"Landmarks is not a list, got: {type(arr)}")
            return jsonify({"error": "Landmarks must be a list"}), 400

        logger.info(f"Received landmarks array of length: {len(arr)}")
        logger.debug(f"First 6 landmarks: {arr[:6] if len(arr) >= 6 else arr}")

        x = np.array(arr, dtype=np.float32).reshape(1, -1)
        if x.shape[1] != 84:
            logger.warning(f"Expected 84 values, got {x.shape[1]}")
            return jsonify({"error": f"Expected 84 values, got {x.shape[1]}"}), 400

        logger.info(f"Input shape for model: {x.shape}")
        logger.debug(f"Input data range: min={x.min():.3f}, max={x.max():.3f}")

        preds = model.predict(x, verbose=0)
        confidence = float(np.max(preds))
        idx = int(np.argmax(preds, axis=1)[0])
        predicted = str(label_classes[idx])

        logger.info(f"Prediction: {predicted} (confidence: {confidence:.3f}, index: {idx})")

        return jsonify({
            "predicted": predicted, 
            "confidence": confidence,
            "confirmed": True,
            "index": idx
        })
    except Exception as e:
        logger.exception("predict_frame error")
        return jsonify({"error": str(e)}), 500
    
@app.route("/predict_current", methods=["GET"])
def predict_current():
    global latest_landmarks
    if model is None or label_classes is None:
        return jsonify({"error": "Model not loaded"}), 500
    if latest_landmarks is None:
        return jsonify({"predicted": "None", "confirmed": False})

    try:
        x = np.array(latest_landmarks, dtype=np.float32).reshape(1, -1)
        if x.shape[1] != 84:
            return jsonify({"error": f"Expected 84 values, got {x.shape[1]}"}), 400

        preds = model.predict(x, verbose=0)
        confidence = float(np.max(preds))
        idx = int(np.argmax(preds, axis=1)[0])
        predicted = str(label_classes[idx])

        return jsonify({
            "predicted": predicted,
            "confidence": confidence,
            "confirmed": True
        })
    except Exception as e:
        logger.exception("predict_current error")
        return jsonify({"error": str(e)}), 500
   
@app.route("/get_daily_letters", methods=["GET"])
def get_daily_letters():
    # pick a fixed set per day so all users see same
    random.seed(datetime.date.today().toordinal())
    all_letters = list("ABCD")
    letters = random.sample(all_letters, 3)  # 5 random letters for the day
    return jsonify({"letters": letters})

@app.route("/submit_score", methods=["POST"])
def submit_score():
    """Submit score once per day per user"""
    try:
        data = request.get_json(force=True)
        uid = data.get("uid")
        email = data.get("email")
        score = data.get("score")
        time_taken = data.get("time", None)

        if not uid or score is None:
            return jsonify({"success": False, "error": "Missing uid or score"}), 400

        today = datetime.date.today().isoformat()

        # check if already submitted today
        existing = db.collection("leaderboard") \
            .where("uid", "==", uid) \
            .where("date", "==", today) \
            .stream()

        if any(existing):
            return jsonify({
                "success": False,
                "message": "⚠️ You already attempted today's test. Try again tomorrow."
            }), 403

        # save new record
        db.collection("leaderboard").add({
            "uid": uid,
            "email": email,
            "score": score,
            "time": time_taken,
            "date": today,
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        return jsonify({"success": True, "message": "✅ Score submitted!"})
    except Exception as e:
        logger.exception("submit_score error")
        return jsonify({"success": False, "error": str(e)}), 500 
@app.route("/can_play_today", methods=["GET"])
def can_play_today():
    """Check if user can play today"""
    try:
        uid = request.args.get("uid")
        if not uid:
            return jsonify({"ok": False, "error": "Missing uid"}), 400

        today = datetime.date.today().isoformat()

        existing = db.collection("leaderboard") \
            .where("uid", "==", uid) \
            .where("date", "==", today) \
            .stream()

        if any(existing):
            return jsonify({"ok": False, "message": "Already played today"})
        else:
            return jsonify({"ok": True, "message": "Can play today"})
    except Exception as e:
        logger.exception("can_play_today error")
        return jsonify({"ok": False, "error": str(e)}), 500

# ---- Main ----
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting server on port {port}")
    app.run(host="0.0.0.0", port=port, threaded=True, debug=True)
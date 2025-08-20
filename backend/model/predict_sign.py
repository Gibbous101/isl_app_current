import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf

# Load model once at startup
model = tf.keras.models.load_model("model/sign_language_model.h5")

# Mediapipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# Labels for ISL (A-Z)
labels = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def extract_keypoints(image):
    """
    Extract hand landmarks from a frame using MediaPipe.
    Returns a numpy array of 42 values (x,y for 21 points).
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        landmarks = []
        for lm in results.multi_hand_landmarks[0].landmark:
            landmarks.extend([lm.x, lm.y])
        return np.array(landmarks)
    else:
        return None


def predict_sign(frame):
    """
    Takes a frame, extracts keypoints, predicts sign, and returns best match.
    """
    keypoints = extract_keypoints(frame)
    if keypoints is None:
        return None

    # Reshape for model: (1, 42)
    keypoints = keypoints.reshape(1, -1)

    # Predict
    preds = model.predict(keypoints, verbose=0)
    pred_idx = np.argmax(preds)
    confidence = preds[0][pred_idx]

    if confidence < 0.7:  # threshold
        return None
    return labels[pred_idx]

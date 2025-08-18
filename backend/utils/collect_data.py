import cv2
import mediapipe as mp
import csv
import os
import time

# ===============================
# CONFIG
# ===============================
DATASET_PATH = "backend/model/dataset/data.csv"
NUM_LANDMARKS = 21
COORDS_PER_POINT = 2  # x, y
TOTAL_VALUES = NUM_LANDMARKS * COORDS_PER_POINT * 2  # for 2 hands

# Initialize Mediapipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
mp_draw = mp.solutions.drawing_utils

# ===============================
# Ask for label
# ===============================
label = input("Enter the label for this data collection (e.g., A, B, C): ").strip().upper()

# Create dataset file if it doesn't exist
if not os.path.exists(DATASET_PATH):
    print("Creating new dataset file...")
    os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
    with open(DATASET_PATH, mode='w', newline='') as f:
        header = ['label'] + [f'p{i}' for i in range(TOTAL_VALUES)]
        csv.writer(f).writerow(header)

# ===============================
# Start video capture
# ===============================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
count = 0

print("\n[INFO] Press 'S' to save sample, 'Q' to quit.\n")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Camera not accessible.")
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    row = [label]
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            for lm in hand_landmarks.landmark:
                row.extend([lm.x, lm.y])
        # Fill with zeros if second hand not present
        while len(row) < 1 + TOTAL_VALUES:
            row.append(0.0)

        # Draw landmarks on screen
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # Display instructions
    cv2.putText(frame, f"Label: {label} | Samples: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, "Press S to save, Q to quit", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

    cv2.imshow("Collecting Data", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('s') and len(row) == 1 + TOTAL_VALUES:
        with open(DATASET_PATH, mode='a', newline='') as f:
            csv.writer(f).writerow(row)
        count += 1
        print(f"✅ Sample {count} saved.")
    elif key == ord('q'):
        print(f"\n✅ Saved {count} samples for label '{label}' successfully!")
        break

cap.release()
cv2.destroyAllWindows()

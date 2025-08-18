import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import os

# ===============================
# Load dataset
# ===============================
DATASET_PATH = "backend/model/dataset/data.csv"

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError("❌ Dataset file not found. Please collect data first.")

data = pd.read_csv(DATASET_PATH)

# Separate features and labels
X = data.drop('label', axis=1).values
y = data['label'].values

# Encode labels (A,B,C -> 0,1,2)
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
y_categorical = to_categorical(y_encoded)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_categorical, test_size=0.2, random_state=42, stratify=y_categorical
)

# ===============================
# Build the model
# ===============================
model = Sequential()
model.add(Dense(128, input_dim=X.shape[1], activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(y_categorical.shape[1], activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# ===============================
# Train model
# ===============================
print("\n[INFO] Training model...\n")
history = model.fit(X_train, y_train, epochs=50, batch_size=16, validation_data=(X_test, y_test), verbose=1)

# ===============================
# Evaluate model
# ===============================
loss, accuracy = model.evaluate(X_test, y_test)
print(f"\n✅ Model trained successfully with accuracy: {accuracy*100:.2f}%")

# ===============================
# Save model and label encoder
# ===============================
model.save("model/sign_language_model.h5")
np.save("model/label_classes.npy", label_encoder.classes_)

print("\n✅ Model and label classes saved successfully!")

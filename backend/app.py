from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])  # allow all frontend calls for testing

# ------------------------------
# Predict Current Route
# ------------------------------
@app.route("/predict_current")
def predict_current():
    try:
        return jsonify({"confirmed": True, "predicted": "C"})
    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"confirmed": False, "predicted": "None"})

# ------------------------------
# Predict Game Route
# ------------------------------
@app.route("/predict_game")
def predict_game():
    return jsonify({"confirmed": False, "prediction": "None"})

# ------------------------------
# Video Feed Route (placeholder only)
# ------------------------------
@app.route("/video_feed")
def video_feed():
    try:
        from flask import send_file
        return send_file("placeholder.jpg", mimetype="image/jpeg")
    except Exception as e:
        print("❌ Error in video_feed:", e)
        return "Placeholder not found", 404

# ------------------------------
# Main
# ------------------------------
if __name__ == "__main__":
    print("✅ Flask server running (Render-safe debug)")
    app.run(host="0.0.0.0", port=5000, debug=False)

// src/pages/PracticeMode.js
import React, { useEffect, useRef, useState } from "react";
import BaseLayout from "../components/BaseLayout";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as cam from "@mediapipe/camera_utils";
import "./PracticeMode.css";

const PracticeMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState("");
  const [targetLetter, setTargetLetter] = useState("A");
  const [feedback, setFeedback] = useState("");

  const letters = ["A", "B", "C"]; // extend this list as needed
  const getRandomLetter = () => {
    let random;
    do {
      random = letters[Math.floor(Math.random() * letters.length)];
    } while (random === targetLetter);
    return random;
  };

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    let latestLandmarks = null;

    hands.onResults((results) => {
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      // Clear + draw
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });
        }
        latestLandmarks = results.multiHandLandmarks[0]; // save for backend
      } else {
        latestLandmarks = null;
      }
    });

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    // 🔑 Separate interval for sending to backend
    const sendInterval = setInterval(() => {
      if (latestLandmarks) {
        const landmarkData = latestLandmarks.map((lm) => [lm.x, lm.y, lm.z]);

        fetch("https://isl-app-backend.onrender.com/predict_frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landmarks: landmarkData }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.predicted) {
              setPrediction(data.predicted);
              setFeedback(
                data.predicted === targetLetter
                  ? "✅ Correct!"
                  : "❌ Try again!"
              );
            }
          })
          .catch((err) => console.error("Error:", err));
      }
    }, 800); // send every 800ms

    return () => clearInterval(sendInterval);
  }, [targetLetter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTargetLetter(getRandomLetter());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BaseLayout title="Practice Mode">
      <div className="video-card">
        <h2 className="practice-title">
          Practice your ISL alphabet signs with real-time feedback
        </h2>
        <canvas
          ref={canvasRef}
          className="video-frame"
          width={640}
          height={480}
        />
        <div className="challenge-card">
          <h3>
            Prediction: <span>{prediction || "Detecting..."}</span>
          </h3>
          <h3>
            Target Letter: <span>{targetLetter}</span>
          </h3>
          <h3
            style={{
              color: feedback.startsWith("✅") ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {feedback}
          </h3>
        </div>
      </div>
    </BaseLayout>
  );
};

export default PracticeMode;

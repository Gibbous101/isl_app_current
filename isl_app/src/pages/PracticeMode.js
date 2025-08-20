// src/pages/PracticeMode.js
// npm install @mediapipe/hands @mediapipe/drawing_utils @mediapipe/camera_utils

import React, { useEffect, useRef, useState } from "react";
import BaseLayout from "../components/BaseLayout";
import { Hands } from "@mediapipe/hands";
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

  // Setup Mediapipe Hands + camera
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

    let isSending = false;
    hands.onResults(async (results) => {
      // Always draw the camera feed smoothly
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });

          // Send landmarks only if not already sending
          if (!isSending) {
            isSending = true;

            const landmarkData = landmarks.map((lm) => [lm.x, lm.y, lm.z]);

            fetch("https://isl-app-backend.onrender.com/predict_frame", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ landmarks: landmarkData }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.predicted) {
                  setPrediction(data.predicted);
                }
              })
              .catch((err) => console.error("Error:", err))
              .finally(() => {
                isSending = false; // Allow next request
              });
          }
        }
      }

      canvasCtx.restore();
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
  }, [targetLetter]);

  // Change target letter every 5s
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
          Practice your ASL alphabet signs with real-time feedback
        </h2>

        {/* hidden video for mediapipe */}
        <video
          ref={videoRef}
          className="video-frame"
          width="640"
          height="480"
          autoPlay
          muted
          playsInline
          style={{ display: "none" }}
        />
        {/* canvas that shows landmarks + live feed */}
        <canvas
          ref={canvasRef}
          className="video-frame"
          width="640"
          height="480"
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

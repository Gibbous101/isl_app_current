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

  const letters = ["A", "B", "C"]; // extend this list

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

    hands.onResults(async (results) => {
      const canvasEl = canvasRef.current;
      const canvasCtx = canvasEl.getContext("2d");

      // Clear + draw video frame
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0].flatMap((lm) => [
          lm.x,
          lm.y,
          lm.z,
        ]);

        try {
          const res = await fetch(
            "https://isl-app-backend.onrender.com/predict_frame",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ landmarks }),
            }
          );

          const data = await res.json();
          if (data.predicted) {
            const predictedLetter = data.predicted.toUpperCase();
            setPrediction(predictedLetter);
            setFeedback(
              predictedLetter === targetLetter
                ? "✅ Correct!"
                : "❌ Try Again!"
            );
          }
        } catch (err) {
          console.error("Prediction error:", err);
          setFeedback("❌ Error detecting");
        }

        // Draw landmarks
        drawConnectors(canvasCtx, results.multiHandLandmarks[0], HAND_CONNECTIONS, {
          color: "black",
          lineWidth: 2,
        });
        drawLandmarks(canvasCtx, results.multiHandLandmarks[0], {
          color: "red",
          lineWidth: 1,
        });
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

        {/* Show video for debugging */}
        <video
          ref={videoRef}
          className="video-frame"
          width="640"
          height="480"
          autoPlay
          muted
          playsInline
          style={{ display: "block" }} // 👈 changed from "none"
        />

        {/* Canvas that overlays landmarks */}
        <canvas
          ref={canvasRef}
          className="video-frame"
          width="640"
          height="480"
          style={{ position: "absolute", top: 0, left: 0 }}
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

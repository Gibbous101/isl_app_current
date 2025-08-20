// npm install @mediapipe/hands @mediapipe/drawing_utils @mediapipe/camera_utils

import React, { useState, useEffect, useRef } from "react";
import BaseLayout from "../components/BaseLayout";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import "./PracticeMode.css";

const PracticeMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [prediction, setPrediction] = useState("");
  const [targetLetter, setTargetLetter] = useState("A");
  const [feedback, setFeedback] = useState("");

  const targetRef = useRef(targetLetter);
  useEffect(() => {
    targetRef.current = targetLetter;
  }, [targetLetter]);

  const letters = ["A", "B", "C"]; // Add all letters as needed

  const getRandomLetter = () => {
    let random;
    do {
      random = letters[Math.floor(Math.random() * letters.length)];
    } while (random === targetLetter);
    return random;
  };

  // Initialize Mediapipe Hands
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(async (results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]
          .flatMap((p) => [p.x, p.y, p.z])
          .slice(0, 63); // Ensure length is 63

        try {
          const res = await fetch(
            "https://isl-app-backend.onrender.com/predict_current",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ landmarks }),
            }
          );
          const data = await res.json();

          if (data.confirmed) {
            const predictedLetter = data.predicted.trim().toUpperCase();
            setPrediction(predictedLetter);

            if (predictedLetter === targetRef.current.toUpperCase()) {
              setFeedback("✅ Correct!");
            } else {
              setFeedback("❌ Try Again!");
            }
          } else {
            setPrediction("");
            setFeedback("Detecting...");
          }
        } catch (err) {
          console.error("Error fetching prediction:", err);
          setFeedback("❌ Error detecting");
        }
      } else {
        setPrediction("");
        setFeedback("Detecting...");
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  // Change target letter every 5 seconds
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
        <video
          ref={videoRef}
          className="video-frame"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
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

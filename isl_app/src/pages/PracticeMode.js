// src/pages/PracticeMode.js
import React, { useEffect, useRef, useState } from "react";
import * as cam from "@mediapipe/camera_utils";
import * as Hands from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function PracticeMode() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState(null);

  // Flag to avoid overlapping backend requests
  let isSending = false;

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    const hands = new Hands.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

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

    // Setup camera
    const camera = new cam.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Practice Mode</h1>

      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
      />

      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-lg border border-gray-700"
        width="640"
        height="480"
      />

      {prediction && (
        <p className="mt-4 text-lg">
          Predicted Letter: <span className="font-bold">{prediction}</span>
        </p>
      )}
    </div>
  );
}

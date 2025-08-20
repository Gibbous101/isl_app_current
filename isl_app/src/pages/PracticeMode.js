import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as cam from "@mediapipe/camera_utils";

export default function PracticeMode() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState("");

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
      const canvasCtx = canvasRef.current.getContext("2d");
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0].flatMap((lm) => [
          lm.x,
          lm.y,
          lm.z,
        ]);

        // ✅ Send landmarks to backend
        try {
          const res = await fetch("http://localhost:5000/predict_landmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ landmarks }),
          });
          const data = await res.json();
          if (data.predicted) {
            setPrediction(data.predicted);
          }
        } catch (err) {
          console.error("Prediction error:", err);
        }

        // Draw hand landmarks on canvas
        drawConnectors(canvasCtx, results.multiHandLandmarks[0], Hands.HAND_CONNECTIONS, { color: "black", lineWidth: 2 });
        drawLandmarks(canvasCtx, results.multiHandLandmarks[0], { color: "red", lineWidth: 1 });
      }
      canvasCtx.restore();
    });

    if (typeof videoRef.current !== "undefined" && videoRef.current !== null) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} className="hidden" width="640" height="480" autoPlay />
      <canvas ref={canvasRef} className="border rounded-xl shadow-lg" width="640" height="480" />
      <h2 className="mt-4 text-xl font-bold">Prediction: {prediction}</h2>
    </div>
  );
}

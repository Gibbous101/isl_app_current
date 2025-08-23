// src/pages/PracticeMode.js
// npm i @mediapipe/hands @mediapipe/drawing_utils @mediapipe/camera_utils

import React, { useEffect, useRef, useState } from "react";
import BaseLayout from "../components/BaseLayout";
import { Hands } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as cam from "@mediapipe/camera_utils";
import "./PracticeMode.css";

const BACKEND = "https://isl-app-backend.onrender.com";

const letters = ["A", "B", "C"]; // extend later if you like
const PICK_INTERVAL_MS = 5000;
const POST_INTERVAL_MS = 100; // throttle to 10 fps max

export default function PracticeMode() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const lastPostRef = useRef(0);
  const sendingRef = useRef(false);

  const [prediction, setPrediction] = useState("");
  const [targetLetter, setTargetLetter] = useState("A");
  const [feedback, setFeedback] = useState("");

  // pick a different letter
  useEffect(() => {
    const choose = () => {
      let r;
      do {
        r = letters[Math.floor(Math.random() * letters.length)];
      } while (r === targetLetter);
      setTargetLetter(r);
    };
    const id = setInterval(choose, PICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [targetLetter]);

  // init Mediapipe once
  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      modelComplexity: 1,
    });
    handsRef.current = hands;

    hands.onResults(async (results) => {
      // draw landmarks to hidden canvas if you want to debug
      const canvasEl = canvasRef.current;
      if (canvasEl) {
        const ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        if (results.multiHandLandmarks?.length) {
          const lm = results.multiHandLandmarks[0];
          drawConnectors(ctx, lm, Hands.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2,
          });
          drawLandmarks(ctx, lm, { color: "#FF0000", lineWidth: 1 });
        }
      }

      // throttle posts
      const now = performance.now();
      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0 ||
        sendingRef.current ||
        now - lastPostRef.current < POST_INTERVAL_MS
      ) {
        return;
      }

      lastPostRef.current = now;
      sendingRef.current = true;

      const lm = results.multiHandLandmarks[0];
      // backend expects flat array of 63 numbers (x,y,z * 21)
      const flat63 = lm.flatMap((p) => [p.x, p.y, p.z]).slice(0, 63);

      try {
        const res = await fetch(`${BACKEND}/predict_frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landmarks: flat63 }),
        });
        const data = await res.json();
        if (data?.predicted) {
          const p = String(data.predicted).toUpperCase();
          setPrediction(p);
          setFeedback(p === targetLetter ? "✅ Correct!" : "❌ Try Again!");
        }
      } catch (e) {
        // network hiccups shouldn't freeze UI
        // console.error(e);
      } finally {
        sendingRef.current = false;
      }
    });

    // camera
    const videoEl = videoRef.current;
    if (videoEl) {
      // avoid autoplay policy issues on iOS by setting attributes early
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("muted", "");
      const camera = new cam.Camera(videoEl, {
        onFrame: async () => {
          if (handsRef.current) {
            await handsRef.current.send({ image: videoEl });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
    }

    // cleanup once
    return () => {
      try {
        cameraRef.current?.stop();
      } catch {}
      handsRef.current?.close?.();
    };
  }, []); // 🚫 do NOT include targetLetter here

  return (
    <BaseLayout title="Practice Mode">
      <div className="video-card">
        <h2 className="practice-title">
          Practice your ISL alphabet signs with real-time feedback
        </h2>

        {/* visible video stream */}
        <video
          ref={videoRef}
          className="video-frame"
          autoPlay
          muted
          playsInline
        />

        {/* keep canvas hidden, you can show it if you want overlays */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ display: "none" }}
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
}

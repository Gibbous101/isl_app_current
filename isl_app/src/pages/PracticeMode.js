import React, { useState, useEffect, useRef } from "react";
import BaseLayout from "../components/BaseLayout";
import "./PracticeMode.css";

const PracticeMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [prediction, setPrediction] = useState("");
  const [targetLetter, setTargetLetter] = useState("A");
  const [feedback, setFeedback] = useState("");

  // Store latest target letter in a ref so we can access it inside the async loop
  const targetRef = useRef(targetLetter);
  useEffect(() => {
    targetRef.current = targetLetter;
  }, [targetLetter]);

  const letters = ["A", "B", "C"];

  const getRandomLetter = () => {
    let random;
    do {
      random = letters[Math.floor(Math.random() * letters.length)];
    } while (random === targetLetter);
    return random;
  };

  useEffect(() => {
    let started = false;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!started) {
              started = true;
              videoRef.current.play();
              captureAndPredict();
            }
          };
        }
      })
      .catch((err) => console.error("Camera error:", err));
  }, []);

  const captureAndPredict = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      requestAnimationFrame(captureAndPredict);
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameBase64 = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch(
        "https://isl-app-backend.onrender.com/predict_current",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame: frameBase64 }),
        }
      );

      const data = await res.json();
      if (data.confirmed) {
        const predictedLetter = data.predicted.trim().toUpperCase();
        setPrediction(predictedLetter);

        // compare with *latest* target letter
        if (predictedLetter === targetRef.current.toUpperCase()) {
          setFeedback("✅ Correct!");
        } else {
          setFeedback("❌ Try Again!");
        }
      } else {
        setPrediction("");
        setFeedback("Detecting...");
      }
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setFeedback("❌ Error detecting");
    }

    requestAnimationFrame(captureAndPredict);
  };

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
        <video ref={videoRef} className="video-frame" autoPlay muted playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="challenge-card">
          <h3>Prediction: <span>{prediction || "Detecting..."}</span></h3>
          <h3>Target Letter: <span>{targetLetter}</span></h3>
          <h3 style={{ color: feedback.startsWith("✅") ? "green" : "red", fontWeight: "bold" }}>
            {feedback}
          </h3>
        </div>
      </div>
    </BaseLayout>
  );
};

export default PracticeMode;

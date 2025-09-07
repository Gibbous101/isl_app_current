// src/pages/LearnMode.js
import React, { useEffect, useRef, useState } from "react";
import BaseLayout from "../components/BaseLayout";
import API_BASE_URL from "../config";
import "./LearnMode.css";

const letters = ["A", "B", "C"]; // Extend this as needed

export default function LearnMode() {
  const imgRef = useRef(null);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [latestLandmarks, setLatestLandmarks] = useState(null);

  const targetLetter = letters[currentLetterIndex];

  // Fetch latest landmarks from backend
  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/latest_landmarks`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.landmarks && data.landmarks.length === 84) {
          setLatestLandmarks(data.landmarks);
        } else {
          setLatestLandmarks(null);
        }
      } catch (e) {
        console.error("Error fetching landmarks:", e);
      }
    };
    const interval = setInterval(fetchLandmarks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Make prediction when landmarks are available
  useEffect(() => {
    const makePrediction = async () => {
      if (!latestLandmarks || latestLandmarks.length !== 84) return;

      try {
        const res = await fetch(`${API_BASE_URL}/predict_frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landmarks: latestLandmarks }),
        });
        const data = await res.json();
        if (data?.predicted) {
          const p = String(data.predicted).toUpperCase();
          setPrediction(p);
          setFeedback(p === targetLetter ? "✅ Correct!" : "❌ Try Again!");
        } else {
          setPrediction("Detecting...");
          setFeedback("");
        }
      } catch (e) {
        console.error("Prediction error:", e);
        setPrediction("Error");
        setFeedback("");
      }
    };

    if (latestLandmarks) makePrediction();
  }, [latestLandmarks, targetLetter]);

  const handleNext = () => {
    setCurrentLetterIndex((prev) => (prev + 1) % letters.length);
  };

  const handleLetterClick = (index) => {
    setCurrentLetterIndex(index);
  };

  const getFeedbackClass = () => {
    if (feedback.startsWith("✅")) return "feedback-correct";
    if (feedback.startsWith("❌")) return "feedback-incorrect";
    return "";
  };

  return (
    <BaseLayout title="Learn Mode">
      <div className="video-card">
        <h2 className="practice-title">
          Learn ISL letters with your camera
        </h2>

        <div className="split-screen">
          {/* Left Panel: Image */}
          <div className="left-panel">
            <h3>Letter: {targetLetter}</h3>
            <img
              ref={imgRef}
              src={`/images/${targetLetter}.jpg`}
              alt={targetLetter}
              className="letter-image"
            />
          </div>

          {/* Right Panel: Camera */}
          <div className="right-panel">
            <h3>Your Gesture</h3>
            <img
              src={`${API_BASE_URL.replace(/\/$/, "")}/video_feed`}
              alt="Live Video Feed"
              className="video-frame"
            />
          </div>
        </div>

        <div className="challenge-card">
          <h3>
            Prediction:{" "}
            <span className={!prediction || prediction === "Detecting..." ? "detecting" : ""}>
              {prediction || "Detecting..."}
            </span>
          </h3>
          <h3 className={getFeedbackClass()}>
            {feedback || "Try performing the sign!"}
          </h3>

          <div className="navigation">
            <button onClick={handleNext}>Next</button>
          </div>

          {/* Letter List */}
          <div className="letter-list">
            {letters.map((letter, idx) => (
              <button
                key={idx}
                className={currentLetterIndex === idx ? "active" : ""}
                onClick={() => handleLetterClick(idx)}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Test buttons for debugging */}
          <div className="test-buttons">
            <button onClick={async () => {
              const res = await fetch(`${API_BASE_URL}/health`);
              const data = await res.json();
              alert(JSON.stringify(data));
            }}>Test Health</button>

            <button onClick={async () => {
              if (!latestLandmarks) return alert("No landmarks");
              const res = await fetch(`${API_BASE_URL}/predict_frame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ landmarks: latestLandmarks }),
              });
              const data = await res.json();
              alert(JSON.stringify(data));
            }}>Test Prediction</button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}






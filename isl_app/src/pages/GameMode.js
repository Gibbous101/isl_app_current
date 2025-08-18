// src/pages/GameMode.js

import React, { useState, useEffect } from "react";
import BaseLayout from "../components/BaseLayout";
import "./PracticeMode.css";

const GameMode = () => {
  const [frameURL] = useState("https://isl-app-backend.onrender.com/video_feed");
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [letterList, setLetterList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Fetch the daily letter list once on mount
  useEffect(() => {
    fetch("https://isl-app-backend.onrender.com/get_daily_letters")
      .then((res) => res.json())
      .then((data) => {
        setLetterList(data.letters);
        setCurrentIndex(0);
      });
  }, []);

  const targetLetter = letterList[currentIndex];

  // Poll predictions from /predict_current
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        "https://isl-app-backend.onrender.com/predict_current"
      );
      const data = await response.json();

      // ✅ Use 'predicted' instead of 'prediction'
      if (data.predicted && data.predicted !== "None") {
        const predictedLetter = data.predicted.toUpperCase();
        setPrediction(predictedLetter);

        if (predictedLetter === targetLetter) {
          setFeedback("✅ Correct!");
          setScore((prev) => prev + 1);

          if (currentIndex < letterList.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          }
        } else {
          setFeedback("❌ Try Again!");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [targetLetter, letterList, currentIndex]);

  const handleSkip = () => {
    if (currentIndex < letterList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback("");
    }
  };

  return (
    <BaseLayout title="Game Mode">
      <div className="video-card">
        <h2 className="practice-title">Game Mode – complete today’s signs</h2>

        <img className="video-frame" src={frameURL} alt="Live Feed" />

        {targetLetter && (
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
            <button onClick={handleSkip} style={{ marginTop:'8px' }}>
              Skip
            </button>
            <p style={{ marginTop:'10px' }}>Score: {score}</p>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default GameMode;







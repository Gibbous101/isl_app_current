// src/pages/GameMode.js
import React, { useState, useEffect, useRef } from "react";
import BaseLayout from "../components/BaseLayout";
import API_BASE_URL from "../config";
import "./PracticeMode.css";

// ✅ Firebase
import { auth, db } from "../firebase"; 
import { doc, setDoc } from "firebase/firestore";

const POST_INTERVAL_MS = 1000; 
const LETTER_TIME_LIMIT = 20; 

export default function GameMode() {
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [letterList, setLetterList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [latestLandmarks, setLatestLandmarks] = useState(null);

  // ✅ Eligibility states
  const [canPlay, setCanPlay] = useState(null); // null=loading, true=allowed, false=blocked
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Timer states
  const [letterTimer, setLetterTimer] = useState(LETTER_TIME_LIMIT);
  const [totalTime, setTotalTime] = useState(0);
  const letterTimerRef = useRef(null);
  const totalTimerRef = useRef(null);

  // ✅ Check eligibility + fetch letters
  useEffect(() => {
    const checkEligibility = async () => {
      const user = auth.currentUser;
      if (!user) {
        setCanPlay(false);
        setErrorMsg("⚠️ Please log in to play Game Mode.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/can_play_today?uid=${user.uid}`);
        if (!res.ok) throw new Error("Failed to check eligibility");

        const data = await res.json();
        console.log("Eligibility:", data);

        if (!data.ok) {
          setCanPlay(false);
          setErrorMsg("🚫 You have already played today. Come back tomorrow!");
          return;
        }

        // ✅ Allowed → fetch letters
        const res2 = await fetch(`${API_BASE_URL}/get_daily_letters`);
        if (!res2.ok) throw new Error("Failed to fetch daily letters");

        const d = await res2.json();
        setLetterList(d.letters || []);
        setCurrentIndex(0);
        setCanPlay(true);

      } catch (err) {
        console.error("Error checking eligibility:", err);
        setErrorMsg("❌ Something went wrong. Please try again later.");
        setCanPlay(false);
      }
    };

    checkEligibility();
  }, []);

  const targetLetter = letterList[currentIndex];

  // ✅ Start per-letter timer and total timer
  useEffect(() => {
    if (!targetLetter || gameFinished || !canPlay) return;

    setLetterTimer(LETTER_TIME_LIMIT);
    if (letterTimerRef.current) clearInterval(letterTimerRef.current);

    letterTimerRef.current = setInterval(() => {
      setLetterTimer((prev) => {
        if (prev <= 1) {
          clearInterval(letterTimerRef.current);
          handleSkip();
          return LETTER_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    if (!totalTimerRef.current) {
      totalTimerRef.current = setInterval(() => {
        setTotalTime((t) => t + 1);
      }, 1000);
    }

    return () => clearInterval(letterTimerRef.current);
  }, [targetLetter, gameFinished, canPlay]);

  // ✅ Fetch landmarks
  useEffect(() => {
    if (gameFinished || !canPlay) return;

    const fetchLandmarks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/latest_landmarks`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.landmarks?.length === 84) {
          setLatestLandmarks(data.landmarks);
        } else {
          setLatestLandmarks(null);
        }
      } catch (e) {
        console.error("Error fetching landmarks:", e);
      }
    };

    const id = setInterval(fetchLandmarks, POST_INTERVAL_MS);
    return () => clearInterval(id);
  }, [gameFinished, canPlay]);

  // ✅ Predictions
  useEffect(() => {
    const makePrediction = async () => {
      if (!latestLandmarks || latestLandmarks.length !== 84 || !targetLetter || answered) return;

      try {
        const res = await fetch(`${API_BASE_URL}/predict_frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landmarks: latestLandmarks }),
        });

        if (!res.ok) return;
        const data = await res.json();

        if (data?.predicted) {
          const p = String(data.predicted).toUpperCase();
          setPrediction(p);

          if (p === targetLetter) {
            setFeedback("✅ Correct!");
            setScore((prev) => prev + 1);
            setAnswered(true);

            setTimeout(() => {
              if (currentIndex < letterList.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setAnswered(false);
              } else {
                finishGame(score + 1);
              }
            }, 1500);
          } else {
            setFeedback("❌ Try Again!");
          }
        }
      } catch (e) {
        console.error("Prediction error:", e);
      }
    };

    if (latestLandmarks) makePrediction();
  }, [latestLandmarks, targetLetter, answered]);

  // ✅ Skip
  const handleSkip = () => {
    if (currentIndex < letterList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback("");
      setAnswered(false);
    } else {
      finishGame(score);
    }
  };

  // ✅ End game
   const finishGame = async (finalScore) => {
    setGameFinished(true);
    clearInterval(letterTimerRef.current);
    clearInterval(totalTimerRef.current);

    const user = auth.currentUser;
    if (user) {
      try {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        await setDoc(
          doc(db, "leaderboard", `${user.uid}_${today}`), // unique per user per day
          {
            uid: user.uid,
            email: user.email,
            score: finalScore,
            time: totalTime,
            date: today,
          }
        );
      } catch (err) {
        console.error("Error saving score:", err);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ UI states
  if (canPlay === null) {
    return <BaseLayout title="Game Mode"><h2>⏳ Checking eligibility...</h2></BaseLayout>;
  }

  if (!canPlay) {
    return <BaseLayout title="Game Mode"><h2>{errorMsg}</h2></BaseLayout>;
  }

  return (
    <BaseLayout title="Game Mode">
      <div className="video-card">
        <h2 className="practice-title">Game Mode – complete today’s signs</h2>

        {!gameFinished ? (
          <>
            <div className="video-wrapper">
              <img
                src={`${API_BASE_URL.replace(/\/$/, "")}/video_feed`}
                alt="Live Feed"
                className="video-frame"
              />
            </div>

            {targetLetter && (
              <div className="challenge-card">
                <h3>Prediction: <span>{prediction || "Detecting..."}</span></h3>
                <h3>Target Letter: <span>{targetLetter}</span></h3>
                <h3>{feedback || "Show the sign for the target letter!"}</h3>
                <p style={{ fontWeight: "bold", color: "black" }}>
                  ⏳ Time left: {letterTimer}s
                </p>
                <button className="test-button" onClick={handleSkip}>Skip</button>
                <p style={{ marginTop: "10px" }}>Score: {score}</p>
                <p>⏱️ Total Time: {formatTime(totalTime)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="challenge-card">
            <h2>🎉 Thank you for giving today’s test!</h2>
            <p>See you tomorrow 👋</p>
            <h3>Your final score: {score}</h3>
            <h3>⏱️ Time Taken: {formatTime(totalTime)}</h3>
            <h4>📧 Logged in as: {auth.currentUser?.email}</h4>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}

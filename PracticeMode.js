import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";   // ⬅️ import navigate
import BaseLayout from "../components/BaseLayout";
import API_BASE_URL from "../config";
import "./PracticeMode.css";
import PageHeader from "../components/PageHeader";

const letters = ["A", "B", "C"];
const PICK_INTERVAL_MS = 5000;
const POST_INTERVAL_MS = 1000; // Reduced frequency to avoid overwhelming the server

export default function PracticeMode() {
  const imgRef = useRef(null);
  const [prediction, setPrediction] = useState("");
  const [targetLetter, setTargetLetter] = useState("A");
  const [feedback, setFeedback] = useState("");
  const [latestLandmarks, setLatestLandmarks] = useState(null);
  const navigate = useNavigate();

  // pick a new target letter every PICK_INTERVAL_MS
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

  // Fetch latest landmarks from backend
  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/latest_landmarks`);
        if (!res.ok) {
          console.error("Failed to fetch landmarks:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        console.log("Landmarks response:", data); // Debug log
        
        if (data?.landmarks && data.landmarks.length === 126) {
        console.log("Setting landmarks:", data.landmarks.length);
        setLatestLandmarks(data.landmarks);
        } else if (data?.landmarks && data.landmarks.length > 0) {
        console.log("Received landmarks but wrong length:", data.landmarks.length, "expected 126");
        }
         else {
          console.log("No landmarks in response");
          setLatestLandmarks(null);
        }
      } catch (e) {
        console.error("Error fetching landmarks:", e);
      }
    };

    const landmarkInterval = setInterval(fetchLandmarks, POST_INTERVAL_MS);
    return () => clearInterval(landmarkInterval);
  }, []);

  // Make predictions when landmarks are available
  useEffect(() => {
    const makePrediction = async () => {
      if (!latestLandmarks || latestLandmarks.length !== 126) {
      console.log("No landmarks available or wrong length:", latestLandmarks?.length, "expected: 126");
      return;
    }
      console.log("Making prediction with landmarks length:", latestLandmarks.length);
      console.log("First few landmarks:", latestLandmarks.slice(0, 6));
      console.log("Request URL:", `${API_BASE_URL}/predict_frame`);
      
      try {
        const requestBody = JSON.stringify({ landmarks: latestLandmarks });
        console.log("Request body length:", requestBody.length);
        
        const res = await fetch(`${API_BASE_URL}/predict_frame`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: requestBody,
        });
        
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Prediction request failed:", res.status, res.statusText, errorText);
          setPrediction("HTTP Error: " + res.status);
          return;
        }
        
        const responseText = await res.text();
        console.log("Raw response:", responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError, "Raw:", responseText);
          setPrediction("JSON Parse Error");
          return;
        }
        
        console.log("Parsed prediction response:", data);
        
        if (data?.predicted) {
          const p = String(data.predicted).toUpperCase();
          console.log("Setting prediction:", p);
          setPrediction(p);
          setFeedback(p === targetLetter ? "✅ Correct!" : "❌ Try Again!");
        } else if (data?.error) {
          console.error("Prediction error:", data.error);
          setPrediction("Error: " + data.error);
        } else {
          console.error("Unexpected response format:", data);
          setPrediction("Unexpected response");
        }
      } catch (e) {
        console.error("Network error during prediction:", e.name, e.message);
        console.error("Full error:", e);
        setPrediction("Network Error: " + e.message);
      }
    };

    if (latestLandmarks) {
      makePrediction();
    }
  }, [latestLandmarks, targetLetter]);

  // Helper function to handle test button clicks
  const handleTestClick = async (testType, endpoint, body = null) => {
    try {
      const options = {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : {},
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await res.json();
      console.log(`${testType} result:`, data);
      alert(`${testType}: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.error(`${testType} failed:`, e);
      alert(`${testType} failed: ${e.message}`);
    }
  };

  const getFeedbackClass = () => {
    if (feedback.startsWith("✅")) return "feedback-correct";
    if (feedback.startsWith("❌")) return "feedback-incorrect";
    return "";
  };

  return (
    <>
      <PageHeader title="ISL Practice" backTo="/home" />
          <br/><br/><br/>   
    <BaseLayout title="Practice Mode">
      <div className="video-card">
        <h2 className="practice-title">
          Practice your ISL alphabet signs with real-time feedback
        </h2>

        <div className="video-wrapper">
          <img
            src={`${API_BASE_URL.replace(/\/$/, "")}/video_feed`}
            alt="Live Video Feed"
            className="video-frame"
            onError={(e) => {
              console.error("Video feed error:", e);
            }}
          />
        </div>

        <div className="challenge-card">
          <h3>
            Prediction: 
            <span className={!prediction || prediction === "Detecting..." ? "detecting" : ""}>
              {prediction || "Detecting..."}
            </span>
          </h3>
          
          <h3>
            Target Letter: <span>{targetLetter}</span>
          </h3>
          
          <h3 className={getFeedbackClass()}>
            {feedback || "Make a sign to get started!"}
          </h3>

          {/* Test buttons for debugging */}
          <div className="test-buttons">
            <button 
              className="test-button"
              onClick={() => handleTestClick("Health Check", "/health")}
            >
              Test Health
            </button>
            
            <button 
              className="test-button"
              onClick={() => handleTestClick("Test Prediction", "/test_prediction")}
            >
              Test Prediction
            </button>
            
            <button 
              className="test-button"
              onClick={() => handleTestClick("Latest Landmarks", "/latest_landmarks")}
            >
              Test Landmarks
            </button>
            
            <button 
              className="test-button"
              onClick={() => {
                if (!latestLandmarks) {
                  alert("No landmarks available");
                  return;
                }
                handleTestClick("Manual Prediction", "/predict_frame", { landmarks: latestLandmarks });
              }}
            >
              Test Current Landmarks
            </button>
          </div>

          {/* Debug info */}
          <div className="debug-info">
            <div>API Base URL: {API_BASE_URL}</div>
            <div>Landmarks detected: {latestLandmarks ? "Yes" : "No"}</div>
            <div>Landmarks length: {latestLandmarks?.length || 0}</div>
            <div>
              Sample landmarks: {
                latestLandmarks 
                  ? `${latestLandmarks.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...` 
                  : 'None'
              }
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
    </>
  );
}

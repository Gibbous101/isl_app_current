import React, { useState, useEffect, useRef } from 'react';
import BaseLayout from '../components/BaseLayout';
import './PracticeMode.css';

const PracticeMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [prediction, setPrediction] = useState('');
  const [targetLetter, setTargetLetter] = useState('A');
  const [feedback, setFeedback] = useState('');

  const letters = ['A', 'B', 'C']; // letters in your dataset

  const getRandomLetter = () => {
    let random;
    do {
      random = letters[Math.floor(Math.random() * letters.length)];
    } while (random === targetLetter); // avoid repetition
    return random;
  };

  // Start camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(err => console.error('Camera error:', err));
  }, []);

  // Capture frame and send to backend
  const fetchPrediction = async () => {
    if (!videoRef.current) return;

    // Create canvas for capturing frame
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert frame to base64
    const frameBase64 = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('https://isl-app-backend.onrender.com/predict_current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameBase64 })
      });

      const data = await res.json();
      if (data.confirmed) {
        const predictedLetter = data.predicted.trim().toUpperCase();
        setPrediction(predictedLetter);

        if (predictedLetter === targetLetter.toUpperCase()) {
          setFeedback('✅ Correct!');
        } else {
          setFeedback('❌ Try Again!');
        }
      } else {
        setPrediction('');
        setFeedback('Detecting...');
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setFeedback('❌ Error detecting');
    }
  };

  // Fetch prediction every 1 second
  useEffect(() => {
    const interval = setInterval(fetchPrediction, 1000);
    return () => clearInterval(interval);
  }, [targetLetter]);

  // Change target letter every 5 seconds
  useEffect(() => {
    const letterInterval = setInterval(() => {
      setTargetLetter(getRandomLetter());
    }, 5000);
    return () => clearInterval(letterInterval);
  }, []);

  return (
    <BaseLayout title="Practice Mode">
      <div className="video-card">
        <h2 className="practice-title">Practice your ASL alphabet signs with real-time feedback</h2>
        
        <video ref={videoRef} className="video-frame" autoPlay muted playsInline />

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="challenge-card">
          <h3>Prediction: <span>{prediction || 'Detecting...'}</span></h3>
          <h3>Target Letter: <span>{targetLetter}</span></h3>
          <h3 style={{ color: feedback.startsWith('✅') ? 'green' : 'red', fontWeight: 'bold' }}>
            {feedback}
          </h3>
        </div>
      </div>
    </BaseLayout>
  );
};

export default PracticeMode;

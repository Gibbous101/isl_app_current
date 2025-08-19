import React, { useState, useEffect } from 'react';
import BaseLayout from '../components/BaseLayout';
import './PracticeMode.css';

const PracticeMode = () => {
  const [frameURL] = useState('https://isl-app-backend.onrender.com/video_feed');
  const [prediction, setPrediction] = useState('');
  const [targetLetter, setTargetLetter] = useState('A');
  const [feedback, setFeedback] = useState('');

  // ✅ Only the letters available in your dataset
  const letters = ['A', 'B', 'C'];

  const getRandomLetter = () => {
    let random;
    do {
      random = letters[Math.floor(Math.random() * letters.length)];
    } while (random === targetLetter); // avoid picking the same letter twice in a row
    return random;
  };

  const fetchPrediction = async () => {
  try {
    const response = await fetch('https://isl-app-backend.onrender.com/predict_current');
    const data = await response.json();

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
  }
};


  // Fetch prediction every 3 seconds
  useEffect(() => {
    const predictionInterval = setInterval(fetchPrediction, 3000);
    return () => clearInterval(predictionInterval);
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
        
        <img className="video-frame" src={frameURL} alt="Live Feed" />

        <div className="challenge-card">
          <h3>Prediction: <span>{prediction || 'Detecting...'}</span></h3>
          <h3>Target Letter: <span>{targetLetter}</span></h3>
          <h3 
            style={{ color: feedback.startsWith('✅') ? 'green' : 'red', fontWeight: 'bold' }}
          >
            {feedback}
          </h3>
        </div>
      </div>
    </BaseLayout>
  );
};

export default PracticeMode;

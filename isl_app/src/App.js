import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';   // ✅ Add a Home page
import PracticeMode from './pages/PracticeMode';
import GameMode from './pages/GameMode';
import LearnMode from './pages/LearnMode';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default route to signup */}
          <Route path="/" element={<Navigate to="/signup" />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/game/practice" element={<PracticeMode />} />
          <Route path="/game/game" element={<GameMode />} />
          <Route path="/learn" element={<LearnMode />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

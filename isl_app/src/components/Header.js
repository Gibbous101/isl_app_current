import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../App.css';

function Header({ scrollToSection }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <header className="header">
      <h1 className="app-name">🖐 ISL Learning App</h1>
      <nav className="nav-links">
        <button onClick={() => scrollToSection?.('practice')}>Practice Mode</button>        
        <button onClick={() => scrollToSection?.('main')}>Main Mode</button>
        <button onClick={() => scrollToSection?.('learn')}>Learn Mode</button>
        <button onClick={() => scrollToSection?.('leaderboard')}>Leaderboard</button>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </header>
  );
}

export default Header;
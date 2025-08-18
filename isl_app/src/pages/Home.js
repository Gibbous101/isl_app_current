import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../App.css';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <Header />
      <main>
        <section className="section">
          <h2>Practice Mode</h2>
          <p>Test your ISL skills in practice mode. No scores are saved here.</p>
          <Link to="/practice">
            <button>Go to Practice Mode</button>
          </Link>
        </section>
        <section className="section">
          <h2>Main Mode</h2>
          <p>Daily fixed challenge. Scores are saved and compared on the leaderboard.</p>
          <Link to="/game">
            <button>Go to Main Mode</button>
          </Link>
        </section>
        <section className="section">
          <h2>Learn Mode</h2>
          <p>Learn ISL through teacher videos on a split-screen setup.</p>
          <button disabled>Coming Soon</button>
        </section>
        <section className="section">
          <h2>Leaderboard</h2>
          <p>View the top scores of all players in main mode.</p>
          <button disabled>Coming Soon</button>
        </section>
      </main>
    </div>
  );
}

export default Home;

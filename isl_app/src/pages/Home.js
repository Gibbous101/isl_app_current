import React, { useRef } from 'react';
import Header from '../components/Header';
import '../App.css';
import './Home.css';

function Home() {
  const practiceRef = useRef(null);
  const mainRef = useRef(null);
  const learnRef = useRef(null);
  const leaderboardRef = useRef(null);

  const scrollToSection = (section) => {
    if (section === 'practice') practiceRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'main') mainRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'learn') learnRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'leaderboard') leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      <Header scrollToSection={scrollToSection} />
      <main>
        <section ref={practiceRef} className="section">
          <h2>Practice Mode</h2>
          <p>Test your ISL skills in practice mode. No scores are saved here.</p>
        </section>
        <section ref={mainRef} className="section">
          <h2>Main Mode</h2>
          <p>Daily fixed challenge. Scores are saved and compared on the leaderboard.</p>
        </section>
        <section ref={learnRef} className="section">
          <h2>Learn Mode</h2>
          <p>Learn ISL through teacher videos on a split-screen setup.</p>
        </section>
        <section ref={leaderboardRef} className="section">
          <h2>Leaderboard</h2>
          <p>View the top scores of all players in main mode.</p>
        </section>
      </main>
    </div>
  );
}

export default Home;

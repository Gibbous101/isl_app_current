import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../App.css';
import './Home.css';

function Home() {
  // create refs for each section
  const practiceRef = useRef(null);
  const mainRef = useRef(null);
  const learnRef = useRef(null);
  const leaderboardRef = useRef(null);
  const profileRef = useRef(null);

  // function to scroll smoothly
  const scrollToSection = (section) => {
    const refs = {
      practice: practiceRef,
      main: mainRef,
      learn: learnRef,
      leaderboard: leaderboardRef,
      profile: profileRef,
    };

    refs[section]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      <Header scrollToSection={scrollToSection} />

      <main>
        <section ref={practiceRef} className="section">
          <h2>Practice Mode</h2>
          <p>Test your ISL skills in practice mode. No scores are saved here.</p>
          <Link to="/game/practice">
            <button>Go to Practice Mode</button>
          </Link>
        </section>

        <section ref={mainRef} className="section">
          <h2>Main Mode</h2>
          <p>Daily fixed challenge. Scores are saved and compared on the leaderboard.</p>
          <Link to="/game/game">
            <button>Go to Main Mode</button>
          </Link>
        </section>

        <section ref={learnRef} className="section">
          <h2>Learn Mode</h2>
          <p>Learn ISL through teacher videos on a split-screen setup.</p>
          <Link to="/learn">
            <button>Go to Learn Mode</button>
          </Link>
        </section>

        <section ref={leaderboardRef} className="section">
          <h2>Leaderboard</h2>
          <p>View the top scores of all players in main mode.</p>
          <Link to="/leaderboard">
            <button>Go to the Leaderboard</button>
          </Link>
        </section>

        <section ref={profileRef} className="section">
          <h2>Profile</h2>
          <p>View your profile</p>
          <Link to="/profile">
            <button>Go To Your Profile</button>
          </Link>
        </section>
      </main>
    </div>
  );
}

export default Home;

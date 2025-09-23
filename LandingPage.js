import React from "react";
import "./LandingPage.css";
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span role="img"  aria-label="wave">👋</span> ISL App
        </div>
        <div className="nav-links">
        <Link to="/login">
          <button className="btn login">Login</button>
          </Link>
          <Link to="/signup">
          <button className="btn signup">Sign Up</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h1>Learn Indian Sign Language</h1>
        <p>
          Learn ISL through interactive practice, daily challenges, and comprehensive
          video lessons. Test your skills, compete with others, and build confidence
          in sign language communication.
        </p>
        <p className="subtext">
          Explore our learning modes below to get started on your ISL journey.
        </p>
      </header>
<br/><br/>
      {/* Features Section */}
      <section className="features">
        <h2>ISL Learning App Features</h2>
        <div className="feature-grid">
  <div className="feature-card">
    <h3>▶ Practice Mode</h3>
    <p>Test your ISL skills to see how much you know and if you're ready for the main challenge.</p>
  </div>
  <div className="feature-card">
    <h3>🎯 Main Mode</h3>
    <p>A Wordle-style game format that you can only play once daily. Your scores are saved to the leaderboard.</p>
  </div>
  <div className="feature-card">
    <h3>📖 Learn Mode</h3>
    <p>Learn ISL through comprehensive teacher videos presented in an interactive split-screen setup.</p>
  </div>
  <div className="feature-card">
    <h3>🏆 Leaderboard</h3>
    <p>View rankings and compare your performance with other players from the main mode challenges.</p>
  </div>
</div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Learn Something New?</h2>
        <p>Join our community of learners and start your ISL journey today!</p>
        <Link to="/signup">
        <button className="btn get-started">Get Started Now</button>
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;

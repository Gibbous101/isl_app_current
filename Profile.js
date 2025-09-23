import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader"; // ✅ added PageHeader
import "./Profile.css"; // ✅ new CSS file

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({ highest: 0, avg: 0, total: 0 });
  const [achievements, setAchievements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      setUserData({
        email: user.email,
        createdAt: user.metadata.creationTime,
      });

      const q = query(collection(db, "leaderboard"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);

      let scores = [];
      let data = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        scores.push(item.score);
        data.push(item);
      });

      if (scores.length > 0) {
        const highest = Math.max(...scores);
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

        setStats({ highest, avg, total: scores.length });

        // Unlock achievements
        let badgeList = [];
        if (highest >= 10) badgeList.push("🏆 Top Scorer");
        if (avg >= 5) badgeList.push("⚡ Consistent Player");
        if (scores.length >= 10) badgeList.push("🎮 Experienced");
        setAchievements(badgeList);
      }

      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setGames(data.slice(0, 5));
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className="profile-page">
      <PageHeader title="ISL Practice" backTo="/home" />
<br/><br/><br/>
      <h1 className="profile-title">My Profile</h1>

      {userData ? (
        <div className="profile-container">
          {/* User Info Card */}
          <div className="card user-info">
            <div>
              <h2>{userData.email}</h2>
              <p>Member since: {new Date(userData.createdAt).toDateString()}</p>
            </div>
            <button
              onClick={() => auth.signOut().then(() => navigate("/login"))}
              className="logout-btn"
            >
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <p>Highest Score</p>
              <h3>{stats.highest}</h3>
            </div>
            <div className="stat-card">
              <p>Avg Score</p>
              <h3>{stats.avg}</h3>
            </div>
            <div className="stat-card">
              <p>Games Played</p>
              <h3>{stats.total}</h3>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="card achievements">
              <h2>Achievements</h2>
              <div className="badges">
                {achievements.map((badge, index) => (
                  <span key={index} className="badge">{badge}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card activity">
            <h2>Recent Activity</h2>
            {games.length > 0 ? (
              <ul>
                {games.map((g, i) => (
                  <li key={i}>
                    <p className="date">{g.date}</p>
                    <p className="details">Score: {g.score} | Time: {g.time}s</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-activity">No recent activity.</p>
            )}
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}

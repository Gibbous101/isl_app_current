import React, { useEffect, useState } from "react";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch((err) => console.error("Error fetching leaderboard:", err));
  }, []);

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      <ul>
        {leaderboard.map((player, index) => (
          <li key={index}>
            {player.username} - {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;



// src/pages/Leaderboard.js
import React, { useEffect, useState } from "react";
import BaseLayout from "../components/BaseLayout";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./PracticeMode.css";
import PageHeader from "../components/PageHeader";



export default function Leaderboard() {
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "leaderboard"));

      // helper to ensure numbers
      const num = (v) => (typeof v === "number" ? v : parseFloat(v || 0)) || 0;

      // date helpers
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6); // last 7 days incl today

      const monthStart = new Date(yyyy, today.getMonth(), 1);

      // aggregators keyed by uid
      const aggDaily = {};
      const aggWeekly = {};
      const aggMonthly = {};

      snap.forEach((d) => {
        const data = d.data();
        const uid = data.uid || "unknown";
        const email = data.email || "unknown";
        const score = num(data.score);
        const time = num(data.time);
        const dateStr = data.date; // expected 'YYYY-MM-DD'

        // make a date object safely
        const playedAt = dateStr ? new Date(`${dateStr}T00:00:00`) : null;

        // DAILY (exact same day)
        if (dateStr === todayStr) {
          if (!aggDaily[uid]) aggDaily[uid] = { uid, email, score: 0, time: 0 };
          aggDaily[uid].score += score;
          aggDaily[uid].time += time;
        }

        // WEEKLY (last 7 days)
        if (playedAt && playedAt >= weekStart && playedAt <= today) {
          if (!aggWeekly[uid]) aggWeekly[uid] = { uid, email, score: 0, time: 0 };
          aggWeekly[uid].score += score;
          aggWeekly[uid].time += time;
        }

        // MONTHLY (current calendar month)
        if (playedAt && playedAt >= monthStart && playedAt <= today) {
          if (!aggMonthly[uid]) aggMonthly[uid] = { uid, email, score: 0, time: 0 };
          aggMonthly[uid].score += score;
          aggMonthly[uid].time += time;
        }
      });

      // to arrays + sort by score desc (then time asc as tiebreak)
      const toSorted = (m) =>
        Object.values(m).sort(
          (a, b) => b.score - a.score || a.time - b.time
        );

      setDaily(toSorted(aggDaily));
      setWeekly(toSorted(aggWeekly));
      setMonthly(toSorted(aggMonthly));
    };

    load();
  }, []);

  return (
    <>
      <PageHeader title="ISL Practice" backTo="/home" />
    <br/><br/><br/>
    <BaseLayout title="Leaderboard">
      <div className="challenge-card">
        <h2>📅 Daily Leaderboard</h2>
        {daily.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          <ul>
            {daily.map((r) => (
              <li key={`d-${r.uid}`}>{r.email} — {r.score} points</li>
            ))}
          </ul>
        )}

        <h2>📈 Weekly Leaderboard</h2>
        {weekly.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          <ul>
            {weekly.map((r) => (
              <li key={`w-${r.uid}`}>{r.email} — {r.score} points</li>
            ))}
          </ul>
        )}

        <h2>📊 Monthly Leaderboard</h2>
        {monthly.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          <ul>
            {monthly.map((r) => (
              <li key={`m-${r.uid}`}>{r.email} — {r.score} points</li>
            ))}
          </ul>
        )}
      </div>
    </BaseLayout>
    </>
  );
}















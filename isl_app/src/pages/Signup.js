import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import '../App.css';

function Signup() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      alert('Signup successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="theme-toggle">
        <label>
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <input
            type="checkbox"
            checked={!isDark}
            onChange={() => setIsDark(!isDark)}
          />
        </label>
      </div>

      <form onSubmit={handleSignup} className="auth-form">
        <h2>Signup</h2>
        <p>Create an account to get started.</p>
        
        {error && <p className="error">{error}</p>}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Signup</button>
        <div style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--accent-color)' }}>
          Already a user? <a href="/login" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>Login</a> if you already have an account.
        </div>
      </form>
    </div>
  );
}

export default Signup;
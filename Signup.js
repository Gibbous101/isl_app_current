import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

function Signup() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      alert('🎉 Signup successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSignup} className="auth-form">
        <h2> Join ISL App</h2>
        <p>Start learning, practicing, and growing today 📚</p>

        {error && <p className="error">{error}</p>}

        <input
          name="email"
          type="email"
          placeholder="📧 Enter your email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="🔑 Create a password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit"> Signup</button>

        <div className="redirect-text">
          Already a user? <a href="/login"> Login</a>
        </div>
      </form>
    </div>
  );
}

export default Signup;

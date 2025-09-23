import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      alert('✅ Login successful!');
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      {error && <div className="popup-error">{error}</div>}
      <form onSubmit={handleLogin} className="auth-form">
        <h2>👋 Welcome Back</h2>
        <p>Log in to continue your journey 🚀</p>

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
          placeholder="🔑 Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit"> Login</button>

        <div className="redirect-text">
          Not a user yet? <a href="/signup"> Signup</a>
        </div>
      </form>
    </div>
  );
}

export default Login;

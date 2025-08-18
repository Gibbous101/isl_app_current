import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import '../App.css';
import './Login.css'; // Assuming you have a separate CSS file for Login styles

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      alert('✅ Login successful!');
      navigate('/home'); // Redirect to Home
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('⚠️ User not found. Please sign up.');
          break;
        case 'auth/wrong-password':
          setError('❌ Incorrect password. Try again.');
          break;
        case 'auth/invalid-email':
          setError('⚠️ Invalid email format.');
          break;
        case 'auth/too-many-requests':
          setError('🚫 Too many failed attempts. Try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
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

      {error && (
        <div className="popup-error">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="auth-form">
        <h2>Login</h2>
        <p>Welcome back! Please sign in to your account.</p>

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
        <button type="submit">Login</button>

        <div className="signup-redirect">
          Not a user yet? <a href="/signup">Signup</a> if you aren't a user already.
        </div>
      </form>
    </div>
  );
}

export default Login;

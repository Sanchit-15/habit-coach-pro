// ===========================================================================
// Signup.jsx — The "Create an account" form (URL "/signup").
// Almost identical to Login.jsx but with an extra "name" field.
// ===========================================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';
// Backend helpers: API base URL + token storage in localStorage.
import { API_URL, setToken } from '../utils/auth.js';

export default function Signup() {
  // One state variable per form field.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // signup() function and completeOnboarding from auth context.
  const { signup, completeOnboarding } = useAuth();
  // For redirecting after a successful signup.
  const navigate = useNavigate();

  // `async` because we call the backend with fetch() and `await` its response.
const handleSubmit = async (e) => {
  // Prevent the browser from refreshing the page automatically.
  e.preventDefault();

  try {
    // Send the signup request to the backend API.
    const res = await fetch(`${API_URL}/api/auth/register`, {
      // HTTP method used to create new data.
      method: 'POST',

      // Tell the backend we are sending JSON data.
      headers: { 'Content-Type': 'application/json' },

      // Convert form values into JSON text.
      body: JSON.stringify({ name, email, password }),
    });

    // Convert backend response into a JavaScript object.
    const data = await res.json();

    // Print backend response in the browser console.
    console.log('[signup] response', res.status, data);

    // If signup failed, stop everything here.
    if (!res.ok) {
      // Show backend error message.
      alert(data.message || 'Signup failed');

      // Prevent fake signup + redirect.
      return;
    }

    // Save JWT token if backend sent one.
    if (data.token) {
      setToken(data.token);
    }

    // Update frontend auth context.
    signup(name, email, password);

    // Mark onboarding as complete so user can access protected pages.
    completeOnboarding();

    // Redirect to habits page.
    navigate('/habits');

  } catch (err) {
    // Runs if backend server is offline or unreachable.
    console.warn('[signup] backend unreachable:', err.message);

    // Show friendly error popup.
    alert('Server error. Please try again.');
  }
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">← Back to home</Link>
        <div className="auth-logo">
          <div className="auth-logo-icon">C</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start building lasting habits today</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            {/* Controlled input pattern: state + onChange. */}
            <input className="form-input" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit">Create Account</button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

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
  // signup() function from auth context.
  const { signup } = useAuth();
  // For redirecting after a successful signup.
  const navigate = useNavigate();

  // `async` because we call the backend with fetch() and `await` its response.
  const handleSubmit = async (e) => {
    e.preventDefault();        // stop the default form reload
    // Try to register against the Express + MongoDB backend.
    try {
      // POST name + email + password as JSON to /api/auth/register.
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      // Parse the JSON body returned by the server.
      const data = await res.json();
      console.log('[signup] response', res.status, data);
      // Persist the JWT for later authenticated requests.
      if (res.ok && data.token) setToken(data.token);
    } catch (err) {
      // Backend down or unreachable — log and keep going with local context.
      console.warn('[signup] backend unreachable, using local auth only:', err.message);
    }
    signup(name, email, password); // call our fake signup (unchanged local flow)
    navigate('/onboarding');   // send user to the welcome wizard
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

// ===========================================================================
// Login.jsx — The login form page (URL "/login").
// Collects email + password, calls the fake login() function, then redirects
// the user to /onboarding.
// ===========================================================================

// useState lets the component remember what the user typed in each field.
import { useState } from 'react';
// Link = nav without reload. useNavigate = navigate from JS code.
import { Link, useNavigate } from 'react-router-dom';
// Hook to call our auth context's login() function.
import { useAuth } from '../context/AuthContext.jsx';
// Shared styles used by both Login and Signup pages.
import './Auth.css';
// Backend helpers: API base URL + token storage in localStorage.
import { API_URL, setToken } from '../utils/auth.js';

export default function Login() {
  // One useState call per input field. The 1st value is the state, the
  // 2nd is the function that updates it.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Pull the login() function out of the auth context.
  const { login } = useAuth();
  // navigate() lets us change the URL programmatically.
  const navigate = useNavigate();

  // Runs when the form is submitted (Enter key or button click).
  // `async` because we call the backend with fetch() and `await` its response.
  const handleSubmit = async (e) => {
    // Forms reload the page by default in browsers — stop that behavior.
    e.preventDefault();
    // Try to log in against the Express + MongoDB backend.
    // If the server isn't running we just fall back to the original local flow
    // so the existing UI keeps working unchanged.
    try {
      // POST email + password as JSON to /api/auth/login.
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      // Parse the JSON body the server sent back.
      const data = await res.json();
      console.log('[login] response', res.status, data);
      // If the server returned a token, persist it for later API calls.
      if (res.ok && data.token) setToken(data.token);
    } catch (err) {
      // Network error (server down, CORS, etc.) — log and continue.
      console.warn('[login] backend unreachable, using local auth only:', err.message);
    }
    // Keep the original local-context login so existing UI/flow is untouched.
    login(email, password);
    // Send the user to the onboarding wizard.
    navigate('/onboarding');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Link back to the public home page. */}
        <Link to="/" className="auth-back">← Back to home</Link>
        <div className="auth-logo">
          <div className="auth-logo-icon">C</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to continue your habit journey</p>
        </div>
        {/* onSubmit fires when the form is submitted. */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            {/* `value` makes this a "controlled" input — React owns its value. */}
            {/* `onChange` updates state on every keystroke. */}
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit">Login</button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

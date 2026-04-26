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
  const handleSubmit = (e) => {
    // Forms reload the page by default in browsers — stop that behavior.
    e.preventDefault();
    // Call the (fake) login function from context.
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

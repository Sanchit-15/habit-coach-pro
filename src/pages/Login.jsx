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
  // Pull the login() function and completeOnboarding out of the auth context.
  const { login, completeOnboarding } = useAuth();
  // navigate() lets us change the URL programmatically.
  const navigate = useNavigate();

  // Runs when the form is submitted (Enter key or button click).
// `async` because we call the backend with fetch() and `await` its response.
const handleSubmit = async (e) => {
  // Prevent the browser from refreshing the page automatically.
  e.preventDefault();

  try {
    // Send the login request to the backend API.
    const res = await fetch(`${API_URL}/api/auth/login`, {
      // HTTP method for sending data securely.
      method: 'POST',

      // Tell the backend we are sending JSON data.
      headers: { 'Content-Type': 'application/json' },

      // Convert the email + password object into JSON text.
      body: JSON.stringify({ email, password }),
    });

    // Convert the backend response into a JavaScript object.
    const data = await res.json();

    // Print the backend response in the browser console for debugging.
    console.log('[login] response', res.status, data);

    // If login failed (wrong email/password), stop everything here.
    if (!res.ok) {
      // Show a friendly popup message to the user.
      alert(data.message || 'Invalid email or password');

      // Exit the function so fake login does NOT continue.
      return;
    }

    // If the backend sent a JWT token, save it in localStorage.
    if (data.token) {
      setToken(data.token);
    }

    // Update the frontend auth context with the logged-in user.
    // Use the actual user name from the backend response.
    login(data.user.email, data.user.name);

    // Mark onboarding as complete so user can access protected pages.
    completeOnboarding();

    // Redirect the user to the habits page.
    navigate('/habits');

  } catch (err) {
    // Runs if the backend server is unreachable or crashes.
    console.warn('[login] backend unreachable:', err.message);

    // Show a friendly error popup.
    alert('Server error. Please try again.');
  }
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

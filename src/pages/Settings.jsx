// ===========================================================================
// Settings.jsx — User profile + app preferences page.
// Uses two contexts (auth, theme) and one local state per form input.
// ===========================================================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
// We need soundEnabled + toggleSound from the habit context.
import { useHabits } from '../context/HabitContext.jsx';
import './Settings.css';

export default function Settings() {
  // Read the current user from auth context.
  const { user } = useAuth();
  // Read theme + a function to flip it.
  const { theme, toggleTheme } = useTheme();
  // Read the sound preference + its toggle function.
  const { soundEnabled, toggleSound } = useHabits();
  // Local state per editable field, pre-filled from the current user.
  // The `||` provides a safe fallback if the user object is empty.
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  // Toggles for "coming soon" features. They store true/false.
  const [reminders, setReminders] = useState(true);
  const [difficulty, setDifficulty] = useState(false);
  const [prediction, setPrediction] = useState(false);

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile and preferences.</p>
      </div>

      {/* PROFILE section. */}
      <div className="settings-section">
        <div className="settings-section-title">👤 Profile</div>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            {/* Controlled input: value comes from state, onChange writes back. */}
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            {/* readOnly stops the user from editing the placeholder dots. */}
            <input className="form-input" type="password" value="••••••••" readOnly />
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Profile saved!')}>Save Changes</button>
        </div>
      </div>

      {/* APPEARANCE section — light/dark switch. */}
      <div className="settings-section">
        <div className="settings-section-title">🎨 Appearance</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Dark Mode</div>
            <div className="settings-row-desc">Switch between light and dark themes</div>
          </div>
          {/* Conditional class shows a different style when "active". */}
          <button className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme} />
        </div>
      </div>

      {/* NOTIFICATIONS + FEATURES section. */}
      <div className="settings-section">
        <div className="settings-section-title">🔔 Notifications & Features</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Reminder Notifications</div>
            <div className="settings-row-desc">Get reminded about your daily habits</div>
          </div>
          <button className={`toggle-switch ${reminders ? 'active' : ''}`} onClick={() => setReminders(!reminders)} />
        </div>
        {/* Sound effects toggle — controls the "ding" played on habit completion. */}
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Sound Effects</div>
            <div className="settings-row-desc">Play a short sound when you mark a habit done</div>
          </div>
          <button className={`toggle-switch ${soundEnabled ? 'active' : ''}`} onClick={toggleSound} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Habit Difficulty Level</div>
            <div className="settings-row-desc">Track difficulty ratings for each habit</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="settings-badge">Coming Soon</span>
            <button className={`toggle-switch ${difficulty ? 'active' : ''}`} onClick={() => setDifficulty(!difficulty)} />
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Risk of Break Prediction</div>
            <div className="settings-row-desc">AI-powered prediction of when you might break a streak</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="settings-badge">Coming Soon</span>
            <button className={`toggle-switch ${prediction ? 'active' : ''}`} onClick={() => setPrediction(!prediction)} />
          </div>
        </div>
      </div>
    </div>
  );
}

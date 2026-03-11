import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [reminders, setReminders] = useState(true);
  const [difficulty, setDifficulty] = useState(false);
  const [prediction, setPrediction] = useState(false);

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile and preferences.</p>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">👤 Profile</div>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value="••••••••" readOnly />
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Profile saved!')}>Save Changes</button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">🎨 Appearance</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Dark Mode</div>
            <div className="settings-row-desc">Switch between light and dark themes</div>
          </div>
          <button className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme} />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">🔔 Notifications & Features</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Reminder Notifications</div>
            <div className="settings-row-desc">Get reminded about your daily habits</div>
          </div>
          <button className={`toggle-switch ${reminders ? 'active' : ''}`} onClick={() => setReminders(!reminders)} />
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

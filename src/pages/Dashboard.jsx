import { useState } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
import './Dashboard.css';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];

const quotes = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
];

export default function Dashboard() {
  const { habits, checkIn } = useHabits();
  const [missModal, setMissModal] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  // Search filter state for filtering habits by name
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length];

  const totalCompleted = habits.reduce((sum, h) => sum + h.completions.filter(c => c.status === 'done').length, 0);
  const totalEntries = habits.reduce((sum, h) => sum + h.completions.length, 0);
  const completionRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const consistencyScore = completionRate >= 90 ? 'A+' : completionRate >= 75 ? 'A' : completionRate >= 60 ? 'B' : completionRate >= 40 ? 'C' : 'D';

  const getTodayStatus = (habit) => {
    const entry = habit.completions.find(c => c.date === today);
    return entry?.status || null;
  };

  const handleDone = (id) => {
    checkIn(id, 'done');
  };

  const handleMiss = (id) => {
    setMissModal(id);
    setSelectedReason('');
    setCustomReason('');
  };

  const submitMiss = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    checkIn(missModal, 'missed', reason);
    setMissModal(null);
  };

  const weeklyData = weekDays.map((day, i) => {
    const date = new Date();
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (i + 1);
    const targetDate = new Date(date);
    targetDate.setDate(date.getDate() - diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    const completed = habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    return { day, completed, total: habits.length };
  });

  {/* Filter habits by search query (simple case-insensitive string match) */}
  const filteredHabits = habits.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your habit overview for today.</p>
      </div>

      {/* Search bar for filtering habits by name */}
      <div className="search-bar-wrapper">
        <input
          className="form-input search-input"
          type="text"
          placeholder="🔍 Search habits..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Best Streak</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{bestStreak} 🔥</div>
          <div className="stat-change positive">Keep it going!</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{completionRate}%</div>
          <div className="stat-change positive">+5% this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Habits Active</div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{habits.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Consistency Score</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{consistencyScore}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Habits</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="today-habits-list">
              {habits.map(habit => {
                const status = getTodayStatus(habit);
                return (
                  <div className="today-habit" key={habit.id}>
                    <div className="habit-color-dot" style={{ background: habit.color }} />
                    <div className="habit-info">
                      <div className="habit-name">{habit.name}</div>
                      <div className="habit-meta">{habit.goal} · {habit.time} · 🔥 {habit.streak}</div>
                    </div>
                    <div className="habit-actions">
                      <button className={`check-btn ${status === 'done' ? 'done' : ''}`} onClick={() => handleDone(habit.id)} title="Mark done">✓</button>
                      <button className={`check-btn ${status === 'missed' ? 'missed' : ''}`} onClick={() => handleMiss(habit.id)} title="Mark missed">✗</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card-header">
              <span className="card-title">Weekly Progress</span>
            </div>
            <div className="chart-container">
              {weeklyData.map(d => (
                <div className="chart-bar-group" key={d.day}>
                  <div className="chart-bar" style={{
                    height: `${d.total > 0 ? (d.completed / d.total) * 160 : 0}px`,
                    background: d.completed === d.total && d.total > 0 ? 'var(--success)' : 'var(--primary)',
                    minHeight: '4px',
                  }} />
                  <span className="chart-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card motivation-card">
            <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💬 Daily Motivation</div>
            <div className="motivation-quote">"{quote.text}"</div>
            <div className="motivation-author">— {quote.author}</div>
          </div>
        </div>
      </div>

      {missModal && (
        <div className="modal-overlay" onClick={() => setMissModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Why did you miss this habit?</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Understanding why helps you improve.</p>
            <div className="reason-options">
              {[...reasons, 'Other'].map(r => (
                <button key={r} className={`reason-btn ${selectedReason === r ? 'selected' : ''}`} onClick={() => setSelectedReason(r)}>{r}</button>
              ))}
            </div>
            {selectedReason === 'Other' && (
              <input className="form-input" placeholder="Tell us more..." value={customReason} onChange={e => setCustomReason(e.target.value)} style={{ width: '100%', marginBottom: 'var(--space-md)' }} />
            )}
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setMissModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitMiss} disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

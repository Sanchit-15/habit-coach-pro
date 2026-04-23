import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useHabits, CATEGORIES, PRIORITIES, CATEGORY_COLORS, PRIORITY_COLORS } from '../context/HabitContext.jsx';
import useReminders from '../hooks/useReminders.js';
import Confetti from '../components/Confetti.jsx';
import UndoToast from '../components/UndoToast.jsx';
import './Dashboard.css';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];
// Emoji options for the daily mood check-in
const MOODS = ['😢', '😐', '🙂', '😀', '🤩'];

// At least 15 motivational quotes — picked deterministically by date so the
// quote stays the same all day but rotates daily.
const quotes = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "First we make our habits, then our habits make us.", author: "Charles C. Noble" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "We become what we repeatedly do.", author: "Sean Covey" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
];

export default function Dashboard() {
  const { habits, moods, checkIn, undoLastCheckIn, setTodayMood, archiveHabit, reorderHabits } = useHabits();

  // Schedule browser notifications for habits with a reminderTime
  useReminders(habits);

  const [missModal, setMissModal] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // FIX: previously these filter states were referenced but never declared
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  // Confetti trigger key — incrementing it restarts the animation
  const [confettiKey, setConfettiKey] = useState(0);
  // Undo toast message (null = hidden)
  const [toastMsg, setToastMsg] = useState(null);
  // Tracks which habit card is being dragged (for visual feedback)
  const dragIdRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  // Pick the day-stable motivational quote based on local date
  const dayIndex = Math.floor((new Date(today).getTime()) / 86400000);
  const quote = quotes[Math.abs(dayIndex) % quotes.length];

  // Show only non-archived habits sorted by their saved order
  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Build a unique sorted list of all tags for the tag filter dropdown
  const allTags = Array.from(new Set(activeHabits.flatMap(h => h.tags || []))).sort();

  const totalCompleted = habits.reduce((sum, h) => sum + h.completions.filter(c => c.status === 'done').length, 0);
  const totalEntries = habits.reduce((sum, h) => sum + h.completions.length, 0);
  const completionRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const consistencyScore = completionRate >= 90 ? 'A+' : completionRate >= 75 ? 'A' : completionRate >= 60 ? 'B' : completionRate >= 40 ? 'C' : 'D';

  const getTodayStatus = (habit) => habit.completions.find(c => c.date === today)?.status || null;

  // Count "done" check-ins this week (Mon→Sun) for a single habit
  const weeklyDoneCount = (habit) => {
    const now = new Date();
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0..Sun=6
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    return habit.completions.filter(c => {
      if (c.status !== 'done') return false;
      const d = new Date(c.date);
      return d >= monday && d <= now;
    }).length;
  };

  const handleDone = (id) => {
    checkIn(id, 'done');
    // Trigger celebration + undo affordance
    setConfettiKey(k => k + 1);
    setToastMsg('Habit marked complete!');
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
    setToastMsg('Miss logged.');
  };

  // Drag-and-drop handlers — operate on filtered visible list, then persist
  const handleDragStart = (id) => { dragIdRef.current = id; };
  const handleDragOver = (e) => { e.preventDefault(); }; // required to allow drop
  const handleDrop = (targetId) => {
    const fromId = dragIdRef.current;
    dragIdRef.current = null;
    if (!fromId || fromId === targetId) return;
    const ids = activeHabits.map(h => h.id);
    const fromIdx = ids.indexOf(fromId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
    reorderHabits(ids);
  };

  const filteredHabits = activeHabits.filter(h => {
    const matchesName = h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !categoryFilter || h.category === categoryFilter;
    const matchesPri = !priorityFilter || h.priority === priorityFilter;
    const matchesTag = !tagFilter || (h.tags || []).includes(tagFilter);
    return matchesName && matchesCat && matchesPri && matchesTag;
  });

  const weeklyData = weekDays.map((day, i) => {
    const date = new Date();
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (i + 1);
    const targetDate = new Date(date);
    targetDate.setDate(date.getDate() - diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    const completed = activeHabits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    return { day, completed, total: activeHabits.length };
  });

  const todayMood = moods[today];

  return (
    <div className="dashboard-page">
      {/* Confetti rains down whenever confettiKey changes */}
      <Confetti trigger={confettiKey} />
      {/* Bottom toast with Undo for the most recent check-in */}
      <UndoToast
        message={toastMsg}
        onUndo={() => { undoLastCheckIn(); setToastMsg(null); }}
        onDismiss={() => setToastMsg(null)}
      />

      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your habit overview for today.</p>
      </div>

      {/* Daily motivational quote at the top of the page */}
      <div className="quote-banner">
        <span className="quote-banner-icon">💬</span>
        <div>
          <div className="quote-banner-text">"{quote.text}"</div>
          <div className="quote-banner-author">— {quote.author}</div>
        </div>
      </div>

      {/* Mood check-in row */}
      <div className="mood-checkin card">
        <div className="mood-checkin-label">How are you feeling today?</div>
        <div className="mood-options">
          {MOODS.map(emoji => (
            <button
              key={emoji}
              className={`mood-btn ${todayMood === emoji ? 'selected' : ''}`}
              onClick={() => setTodayMood(emoji)}
              title={`Set today's mood to ${emoji}`}
            >{emoji}</button>
          ))}
        </div>
      </div>

      {habits.length === 0 && (
        <div className="card empty-state-card">
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <h3>No habits yet</h3>
            <p>Start your consistency journey by creating your first habit.</p>
            <Link to="/habits" className="btn btn-primary" style={{ marginTop: 'var(--space-md)', display: 'inline-block' }}>
              + Add Your First Habit
            </Link>
          </div>
        </div>
      )}

      {activeHabits.length > 0 && (
        <div className="search-bar-wrapper">
          <input
            className="form-input search-input"
            type="text"
            placeholder="🔍 Search habits..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select className="form-select filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-select filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          {/* Tag filter — only shown when at least one tag exists */}
          {allTags.length > 0 && (
            <select className="form-select filter-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
            </select>
          )}
        </div>
      )}

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
          <div className="stat-value" style={{ color: 'var(--info)' }}>{activeHabits.length}</div>
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
              {filteredHabits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                  No habits match your search.
                </div>
              ) : (
                filteredHabits.map(habit => {
                  const status = getTodayStatus(habit);
                  const weeklyDone = weeklyDoneCount(habit);
                  const goal = habit.weeklyGoal || 7;
                  const progressPct = Math.min(100, Math.round((weeklyDone / goal) * 100));
                  return (
                    <div
                      className={`today-habit ${status === 'done' ? 'habit-completed-today' : ''}`}
                      key={habit.id}
                      // Native HTML5 drag-and-drop — reorders visible cards
                      draggable
                      onDragStart={() => handleDragStart(habit.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(habit.id)}
                      style={{ borderLeft: `4px solid ${habit.color}` }}
                    >
                      <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                      <div className="habit-color-dot" style={{ background: habit.color }} />
                      <div className="habit-info">
                        <div className="habit-name">
                          {habit.name}
                          <span className="priority-dot" style={{ background: PRIORITY_COLORS[habit.priority] || '#9CA3AF' }} title={`${habit.priority} priority`} />
                          {habit.notes && <span className="note-icon" title={habit.notes}>📝</span>}
                        </div>
                        <div className="habit-meta">
                          <span
                            className="category-badge"
                            style={{
                              background: (CATEGORY_COLORS[habit.category] || '#9CA3AF') + '22',
                              color: CATEGORY_COLORS[habit.category] || '#6B7280',
                            }}
                          >{habit.category || 'Personal'}</span>
                          {' '}{habit.goal} · {habit.time} · 🔥 {habit.streak}
                          {habit.reminderTime && <> · 🔔 {habit.reminderTime}</>}
                        </div>
                        {/* Weekly goal progress bar */}
                        <div className="weekly-progress" title={`${weeklyDone}/${goal} this week`}>
                          <div className="weekly-progress-bar" style={{ width: `${progressPct}%`, background: habit.color }} />
                          <span className="weekly-progress-label">{weeklyDone}/{goal} this week</span>
                        </div>
                        {habit.tags?.length > 0 && (
                          <div className="tag-list" style={{ marginTop: 4 }}>
                            {habit.tags.map(t => <span key={t} className="tag-pill small">#{t}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="habit-actions">
                        <button className={`check-btn ${status === 'done' ? 'done' : ''}`} onClick={() => handleDone(habit.id)} title="Mark done">✓</button>
                        <button className={`check-btn ${status === 'missed' ? 'missed' : ''}`} onClick={() => handleMiss(habit.id)} title="Mark missed">✗</button>
                        <button className="check-btn archive-btn" onClick={() => archiveHabit(habit.id, true)} title="Archive">📦</button>
                      </div>
                    </div>
                  );
                })
              )}
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

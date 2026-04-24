import { useState, useMemo, useRef } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
import { getQuoteOfTheDay } from '../utils/quotes.js';
import { useReminders } from '../utils/useReminders.js';
import UndoToast from '../components/UndoToast.jsx';
import './Dashboard.css';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];
const moodEmojis = ['😢', '😐', '🙂', '😀', '🤩'];

// Get an array of YYYY-MM-DD strings for the current week (Mon..Sun)
function currentWeekDates() {
  const out = [];
  const today = new Date();
  const day = today.getDay() === 0 ? 7 : today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day - 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

export default function Dashboard() {
  const { habits, checkIn, undoCheckIn, reorderHabits, archiveHabit, moods, setTodayMood, applyStreakFreeze, freezes } = useHabits();
  const [missModal, setMissModal] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [toast, setToast] = useState(null); // { habitId, message }
  const dragId = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const quote = getQuoteOfTheDay();
  const todayMood = moods[today];

  // Schedule notifications for habits with reminderTime
  useReminders(habits);

  // Stats
  const totalCompleted = habits.reduce((s, h) => s + h.completions.filter(c => c.status === 'done').length, 0);
  const totalEntries = habits.reduce((s, h) => s + h.completions.length, 0);
  const completionRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const consistencyScore = completionRate >= 90 ? 'A+' : completionRate >= 75 ? 'A' : completionRate >= 60 ? 'B' : completionRate >= 40 ? 'C' : 'D';

  // Active (non-archived) habits
  const active = useMemo(() => habits.filter(h => !h.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [habits]);

  // All unique tags for filter dropdown
  const allTags = useMemo(() => {
    const set = new Set();
    active.forEach(h => (h.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [active]);

  // Apply search + tag filter
  const filteredHabits = active.filter(h => {
    const matchesQuery = h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !tagFilter || (h.tags || []).includes(tagFilter);
    return matchesQuery && matchesTag;
  });

  const getTodayStatus = (habit) => habit.completions.find(c => c.date === today)?.status || null;

  // Count weekly completions for a habit
  const weekDates = currentWeekDates();
  const weeklyDone = (habit) => habit.completions.filter(c => c.status === 'done' && weekDates.includes(c.date)).length;

  const handleDone = (id, name) => {
    // checkIn() now triggers confetti + ding internally via the context
    checkIn(id, 'done');
    setToast({ habitId: id, message: `"${name}" marked complete!` });
  };

  const handleMiss = (id) => {
    setMissModal(id); setSelectedReason(''); setCustomReason('');
  };

  const submitMiss = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    checkIn(missModal, 'missed', reason);
    setMissModal(null);
  };

  // Drag and drop handlers using HTML5 native API
  const onDragStart = (id) => { dragId.current = id; };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (targetId) => {
    if (dragId.current == null || dragId.current === targetId) return;
    const ids = filteredHabits.map(h => h.id);
    const from = ids.indexOf(dragId.current);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderHabits(ids);
    dragId.current = null;
  };

  const weeklyData = weekDays.map((day, i) => {
    const date = new Date();
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (i + 1);
    const targetDate = new Date(date);
    targetDate.setDate(date.getDate() - diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    const completed = active.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    return { day, completed, total: active.length };
  });

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your habit overview for today.</p>
      </div>

      {/* Quote of the day banner */}
      <div className="quote-banner">
        <span className="quote-banner-icon">💬</span>
        <div>
          <div className="quote-banner-text">"{quote.text}"</div>
          <div className="quote-banner-author">— {quote.author}</div>
        </div>
      </div>

      {/* Mood tracker row */}
      <div className="mood-tracker">
        <span className="mood-label">How are you feeling today?</span>
        <div className="mood-emojis">
          {moodEmojis.map(e => (
            <button
              key={e}
              className={`mood-btn ${todayMood === e ? 'selected' : ''}`}
              onClick={() => setTodayMood(e)}
              title={`Save mood ${e}`}
            >{e}</button>
          ))}
        </div>
      </div>

      {/* Search + tag filter row */}
      <div className="filter-row">
        <input
          className="form-input search-input"
          type="text"
          placeholder="🔍 Search habits..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {allTags.length > 0 && (
          <select className="form-input tag-filter" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Best Streak</div><div className="stat-value" style={{ color: 'var(--primary)' }}>{bestStreak} 🔥</div></div>
        <div className="stat-card"><div className="stat-label">Completion Rate</div><div className="stat-value" style={{ color: 'var(--success)' }}>{completionRate}%</div></div>
        <div className="stat-card"><div className="stat-label">Habits Active</div><div className="stat-value" style={{ color: 'var(--info)' }}>{active.length}</div></div>
        <div className="stat-card"><div className="stat-label">Consistency</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{consistencyScore}</div></div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Habits</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Drag to reorder</span>
            </div>
            <div className="today-habits-list">
              {active.length === 0 ? (
                /* Friendly empty state shown when the user has zero habits */
                <div className="empty-illustration">
                  <div className="empty-illustration-emoji">🌱</div>
                  <h3>No habits yet!</h3>
                  <p>Start your journey by creating your first habit.</p>
                  <a href="/habits" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>+ Add Habit</a>
                </div>
              ) : filteredHabits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                  No habits match your filters.
                </div>
              ) : (
                filteredHabits.map(habit => {
                  const status = getTodayStatus(habit);
                  const done = weeklyDone(habit);
                  const goal = habit.weeklyGoal || 7;
                  const pct = Math.min(100, Math.round((done / goal) * 100));
                  return (
                    <div
                      className={`today-habit ${status === 'done' ? 'habit-completed-today' : ''}`}
                      key={habit.id}
                      style={{ borderLeft: `4px solid ${habit.color}` }}
                      draggable
                      onDragStart={() => onDragStart(habit.id)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(habit.id)}
                    >
                      <div className="habit-info">
                        <div className="habit-name">
                          {habit.name}
                          {habit.note && <span className="note-icon" title={habit.note}>📝</span>}
                        </div>
                        <div className="habit-meta">
                          {habit.goal} · 🔥 {habit.streak}
                          {habit.reminderTime && <> · 🔔 {habit.reminderTime}</>}
                        </div>
                        {(habit.tags || []).length > 0 && (
                          <div className="habit-tags-inline">
                            {habit.tags.map(t => <span key={t} className="tag-pill">#{t}</span>)}
                          </div>
                        )}
                        {/* Weekly goal progress */}
                        <div className="weekly-progress" title={`${done}/${goal} this week`}>
                          <div className="weekly-progress-bar" style={{ width: `${pct}%`, background: habit.color }} />
                        </div>
                        <div className="weekly-progress-text">{done}/{goal} this week</div>
                      </div>
                      <div className="habit-actions">
                        <button className={`check-btn ${status === 'done' ? 'done' : ''}`} onClick={() => handleDone(habit.id, habit.name)} title="Mark done">✓</button>
                        <button className={`check-btn ${status === 'missed' ? 'missed' : ''}`} onClick={() => handleMiss(habit.id)} title="Mark missed">✗</button>
                        <button className="check-btn" onClick={() => archiveHabit(habit.id)} title="Archive">📦</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card-header"><span className="card-title">Weekly Progress</span></div>
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

            {/* Streak Freeze: lets the user excuse a miss without losing the streak */}
            <div className="freeze-box">
              <div className="freeze-info">
                <strong>🧊 Streak Freeze</strong>
                <span>{freezes.count} of 1 left this week</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                disabled={freezes.count <= 0}
                onClick={() => {
                  // First record the miss so today has an entry, then convert it to "excused"
                  const reason = selectedReason === 'Other' ? customReason : (selectedReason || 'Excused');
                  checkIn(missModal, 'missed', reason);
                  // Defer the freeze swap until after the miss has been written
                  setTimeout(() => {
                    applyStreakFreeze(missModal);
                    setMissModal(null);
                  }, 0);
                }}
              >Use Streak Freeze</button>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setMissModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitMiss} disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {toast && (
        <UndoToast
          message={toast.message}
          onUndo={() => undoCheckIn(toast.habitId)}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

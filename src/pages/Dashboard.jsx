// ===========================================================================
// Dashboard.jsx — The main page after login. Shows:
//   - Quote of the day banner
//   - Mood tracker row
//   - Search + tag filter for habits
//   - 4 stat cards (best streak, completion rate, active count, consistency)
//   - "Today's Habits" list with check / miss / archive buttons
//   - Weekly progress bar chart
//   - Daily motivation card
//   - "Why did you miss?" modal + Streak Freeze
//   - Undo toast
// ===========================================================================

// useState keeps small bits of state (modal open/close, search text, etc.).
// useMemo caches calculated values so we don't redo work on every render.
// useRef holds a mutable value that doesn't trigger re-renders (the dragged id).
import { useState, useMemo, useRef } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
// Helper that returns one motivational quote based on today's date.
import { getQuoteOfTheDay } from '../utils/quotes.js';
// Custom hook that schedules browser notifications based on habit reminderTime.
import { useReminders } from '../utils/useReminders.js';
// The little Undo toast component shown after marking a habit done.
import UndoToast from '../components/UndoToast.jsx';
import './Dashboard.css';

// Constant arrays used for UI labels.
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];
const moodEmojis = ['😢', '😐', '🙂', '😀', '🤩'];

// Returns YYYY-MM-DD strings for the current week (Mon..Sun).
function currentWeekDates() {
  const out = [];
  const today = new Date();
  // Treat Sunday as 7 so Monday = 1 (matches our display order).
  const day = today.getDay() === 0 ? 7 : today.getDay();
  // Find this week's Monday by subtracting (day - 1) days.
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day - 1));
  // Build 7 consecutive dates starting from Monday.
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

export default function Dashboard() {
  // Destructure only the bits of context we use on this page.
  const { habits, checkIn, undoCheckIn, reorderHabits, archiveHabit, moods, setTodayMood, applyStreakFreeze, freezes } = useHabits();
  // Which habit's "miss reason" modal is open. null = closed.
  const [missModal, setMissModal] = useState(null);
  // Selected reason inside the miss modal.
  const [selectedReason, setSelectedReason] = useState('');
  // Free-text reason when the user picks "Other".
  const [customReason, setCustomReason] = useState('');
  // Search box text.
  const [searchQuery, setSearchQuery] = useState('');
  // Selected tag in the dropdown (empty string = all).
  const [tagFilter, setTagFilter] = useState('');
  // Toast info: { habitId, message } or null when no toast is showing.
  const [toast, setToast] = useState(null);
  // useRef returns a "box" with a `.current` property. Changing it does NOT
  // re-render the component — perfect for tracking the currently dragged habit.
  const dragId = useRef(null);

  // Today's date as YYYY-MM-DD.
  const today = new Date().toISOString().split('T')[0];
  // The chosen quote for today (deterministic per day).
  const quote = getQuoteOfTheDay();
  // The emoji the user picked for today (or undefined).
  const todayMood = moods[today];

  // Schedule reminder notifications for all habits. The hook handles permission.
  useReminders(habits);

  // ---- Calculate the four "summary" numbers shown at the top ----
  const totalCompleted = habits.reduce((s, h) => s + h.completions.filter(c => c.status === 'done').length, 0);
  const totalEntries = habits.reduce((s, h) => s + h.completions.length, 0);
  const completionRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  // A simple letter grade based on rate. Uses chained ternaries.
  const consistencyScore = completionRate >= 90 ? 'A+' : completionRate >= 75 ? 'A' : completionRate >= 60 ? 'B' : completionRate >= 40 ? 'C' : 'D';

  // useMemo: sort the active (non-archived) habits by their saved order.
  // The result is cached and only recalculated when `habits` changes.
  const active = useMemo(() => habits.filter(h => !h.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [habits]);

  // Build a unique list of all tags used by active habits.
  // Set is a built-in JS collection that automatically removes duplicates.
  const allTags = useMemo(() => {
    const set = new Set();
    active.forEach(h => (h.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [active]);

  // Apply the search box + tag dropdown to filter the visible habits.
  const filteredHabits = active.filter(h => {
    const matchesQuery = h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !tagFilter || (h.tags || []).includes(tagFilter);
    return matchesQuery && matchesTag;
  });

  // For a given habit, returns 'done' | 'missed' | 'excused' | null for today.
  const getTodayStatus = (habit) => habit.completions.find(c => c.date === today)?.status || null;

  // Used by the per-habit weekly progress bar.
  const weekDates = currentWeekDates();
  const weeklyDone = (habit) => habit.completions.filter(c => c.status === 'done' && weekDates.includes(c.date)).length;

  // Click "✓": mark today's check-in as done and show an Undo toast.
  const handleDone = (id, name) => {
    // checkIn() now triggers confetti + ding internally via the context.
    checkIn(id, 'done');
    setToast({ habitId: id, message: `"${name}" marked complete!` });
  };

  // Click "✗": open the "Why did you miss?" modal for this habit.
  const handleMiss = (id) => {
    setMissModal(id); setSelectedReason(''); setCustomReason('');
  };

  // Submit the modal — record the miss with the chosen reason.
  const submitMiss = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    checkIn(missModal, 'missed', reason);
    setMissModal(null);
  };

  // ---- Drag and drop using the native HTML5 API ----
  // onDragStart: remember which habit is being dragged.
  const onDragStart = (id) => { dragId.current = id; };
  // onDragOver: must call preventDefault so onDrop can fire.
  const onDragOver = (e) => e.preventDefault();
  // onDrop: move the dragged habit to the position of the target habit.
  const onDrop = (targetId) => {
    if (dragId.current == null || dragId.current === targetId) return;
    const ids = filteredHabits.map(h => h.id);
    const from = ids.indexOf(dragId.current);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    // splice(from, 1) removes the dragged id; splice(to, 0, removed) inserts it.
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderHabits(ids);
    dragId.current = null;
  };

  // ---- Build the data for the small bar chart ----
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

      {/* Quote of the day banner. */}
      <div className="quote-banner">
        <span className="quote-banner-icon">💬</span>
        <div>
          <div className="quote-banner-text">"{quote.text}"</div>
          <div className="quote-banner-author">— {quote.author}</div>
        </div>
      </div>

      {/* Mood tracker row — picking an emoji saves it to context. */}
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

      {/* Search input + tag dropdown filter. */}
      <div className="filter-row">
        <input
          className="form-input search-input"
          type="text"
          placeholder="🔍 Search habits..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {/* Only show the dropdown if there is at least one tag in use. */}
        {allTags.length > 0 && (
          <select className="form-input tag-filter" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
      </div>

      {/* Top 4 summary stat cards. */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Best Streak</div><div className="stat-value" style={{ color: 'var(--primary)' }}>{bestStreak} 🔥</div></div>
        <div className="stat-card"><div className="stat-label">Completion Rate</div><div className="stat-value" style={{ color: 'var(--success)' }}>{completionRate}%</div></div>
        <div className="stat-card"><div className="stat-label">Habits Active</div><div className="stat-value" style={{ color: 'var(--info)' }}>{active.length}</div></div>
        <div className="stat-card"><div className="stat-label">Consistency</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{consistencyScore}</div></div>
      </div>

      <div className="dashboard-grid">
        <div>
          {/* "Today's Habits" card. */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Habits</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Drag to reorder</span>
            </div>
            <div className="today-habits-list">
              {/* Three states: zero habits, filtered to nothing, or render the list. */}
              {active.length === 0 ? (
                /* Friendly empty state shown when the user has zero habits. */
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
                // Map each filtered habit to a card row.
                filteredHabits.map(habit => {
                  const status = getTodayStatus(habit);
                  const done = weeklyDone(habit);
                  const goal = habit.weeklyGoal || 7;
                  // Math.min caps the percentage at 100 (never overflows the bar).
                  const pct = Math.min(100, Math.round((done / goal) * 100));
                  return (
                    <div
                      className={`today-habit ${status === 'done' ? 'habit-completed-today' : ''}`}
                      key={habit.id}
                      // Inline style: dynamic left border in the habit's color.
                      style={{ borderLeft: `4px solid ${habit.color}` }}
                      // `draggable` enables HTML5 drag/drop on this element.
                      draggable
                      onDragStart={() => onDragStart(habit.id)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(habit.id)}
                    >
                      <div className="habit-info">
                        <div className="habit-name">
                          {habit.name}
                          {/* Show 📝 icon when a note exists; `title` shows it on hover. */}
                          {habit.note && <span className="note-icon" title={habit.note}>📝</span>}
                        </div>
                        <div className="habit-meta">
                          {habit.goal} · 🔥 {habit.streak}
                          {/* The <></> fragment lets us add multiple children inside the inline-show. */}
                          {habit.reminderTime && <> · 🔔 {habit.reminderTime}</>}
                        </div>
                        {(habit.tags || []).length > 0 && (
                          <div className="habit-tags-inline">
                            {habit.tags.map(t => <span key={t} className="tag-pill">#{t}</span>)}
                          </div>
                        )}
                        {/* Weekly goal progress bar. */}
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

          {/* Weekly bar chart. */}
          <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card-header"><span className="card-title">Weekly Progress</span></div>
            <div className="chart-container">
              {weeklyData.map(d => (
                <div className="chart-bar-group" key={d.day}>
                  <div className="chart-bar" style={{
                    // Height proportional to completion ratio (max 160px).
                    height: `${d.total > 0 ? (d.completed / d.total) * 160 : 0}px`,
                    // Green when 100% complete, primary color otherwise.
                    background: d.completed === d.total && d.total > 0 ? 'var(--success)' : 'var(--primary)',
                    minHeight: '4px',
                  }} />
                  <span className="chart-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: motivational quote card. */}
        <div>
          <div className="card motivation-card">
            <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💬 Daily Motivation</div>
            <div className="motivation-quote">"{quote.text}"</div>
            <div className="motivation-author">— {quote.author}</div>
          </div>
        </div>
      </div>

      {/* "Why did you miss?" modal. Only renders when missModal !== null. */}
      {missModal && (
        // Click on the dim overlay to cancel.
        <div className="modal-overlay" onClick={() => setMissModal(null)}>
          {/* stopPropagation so clicks INSIDE the white box don't close it. */}
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Why did you miss this habit?</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Understanding why helps you improve.</p>
            <div className="reason-options">
              {/* Render preset reasons + an "Other" option. */}
              {[...reasons, 'Other'].map(r => (
                <button key={r} className={`reason-btn ${selectedReason === r ? 'selected' : ''}`} onClick={() => setSelectedReason(r)}>{r}</button>
              ))}
            </div>
            {/* Show free-text input only when "Other" is selected. */}
            {selectedReason === 'Other' && (
              <input className="form-input" placeholder="Tell us more..." value={customReason} onChange={e => setCustomReason(e.target.value)} style={{ width: '100%', marginBottom: 'var(--space-md)' }} />
            )}

            {/* Streak Freeze: lets the user excuse a miss without losing the streak. */}
            <div className="freeze-box">
              <div className="freeze-info">
                <strong>🧊 Streak Freeze</strong>
                <span>{freezes.count} of 1 left this week</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                disabled={freezes.count <= 0}
                onClick={() => {
                  // First record a miss so today has an entry, then convert it to "excused".
                  const reason = selectedReason === 'Other' ? customReason : (selectedReason || 'Excused');
                  checkIn(missModal, 'missed', reason);
                  // setTimeout(..., 0) defers the freeze swap to the next tick so React
                  // has time to commit the previous state update first.
                  setTimeout(() => {
                    applyStreakFreeze(missModal);
                    setMissModal(null);
                  }, 0);
                }}
              >Use Streak Freeze</button>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setMissModal(null)}>Cancel</button>
              {/* Submit is disabled until a reason is chosen (or filled in). */}
              <button className="btn btn-primary btn-sm" onClick={submitMiss} disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast — shown only when toast is not null. */}
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

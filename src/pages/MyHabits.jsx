// ===========================================================================
// MyHabits.jsx — Page where the user creates, edits, archives, and deletes habits.
// Uses a modal (popup) for the create/edit form.
// ===========================================================================

import { useState } from 'react';
// Pull habit data + actions from the global habit context.
import { useHabits } from '../context/HabitContext.jsx';
import './MyHabits.css';

// Preset accent colors the user can pick from for each habit.
const COLOR_PRESETS = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C', '#E91E63', '#34495E'];

export default function MyHabits() {
  // Destructure exactly the actions we need.
  const { habits, addHabit, updateHabit, deleteHabit, archiveHabit } = useHabits();
  // Whether the create/edit modal is open.
  const [showForm, setShowForm] = useState(false);
  // ID of the habit being edited (null when we're creating a new one).
  const [editId, setEditId] = useState(null);
  // The form state lives in a single object so we can update it cleanly.
  const [form, setForm] = useState({
    name: '', goal: '', frequency: 'daily', time: 'morning',
    note: '', color: COLOR_PRESETS[0], reminderTime: '', weeklyGoal: 7, tags: '',
  });

  // Helper to clear the form and close the modal.
  const resetForm = () => {
    setForm({ name: '', goal: '', frequency: 'daily', time: 'morning', note: '', color: COLOR_PRESETS[0], reminderTime: '', weeklyGoal: 7, tags: '' });
    setEditId(null);
    setShowForm(false);
  };

  // Runs when the form is submitted (Create or Update).
  const handleSubmit = (e) => {
    e.preventDefault(); // stop the page from reloading
    // Convert the comma-separated `tags` string into a clean array of tags.
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    // Build the full payload sent to context. Number(...) ensures weeklyGoal is numeric.
    const payload = { ...form, tags, weeklyGoal: Number(form.weeklyGoal) || 7 };
    // If we have an editId, we're updating; otherwise creating.
    if (editId) updateHabit(editId, payload);
    else addHabit(payload);
    resetForm();
  };

  // Pre-fill the form with an existing habit's values, then open the modal.
  const handleEdit = (habit) => {
    setForm({
      name: habit.name, goal: habit.goal, frequency: habit.frequency, time: habit.time,
      note: habit.note || '', color: habit.color || COLOR_PRESETS[0],
      reminderTime: habit.reminderTime || '', weeklyGoal: habit.weeklyGoal ?? 7,
      // Convert the tags array back into a comma-separated string for the input.
      tags: (habit.tags || []).join(', '),
    });
    setEditId(habit.id);
    setShowForm(true);
  };

  // Show only non-archived habits on this page.
  const visible = habits.filter(h => !h.archived);

  return (
    <div className="habits-page">
      <div className="habits-header">
        <div className="page-header">
          <h1>My Habits</h1>
          <p>Create, manage, and track your daily habits.</p>
        </div>
        {/* "+ New Habit" opens the modal in create mode. */}
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Habit</button>
      </div>

      {/* Modal: only rendered when showForm is true. */}
      {showForm && (
        // Clicking the overlay (outside the inner modal) closes the form.
        <div className="modal-overlay" onClick={resetForm}>
          {/* stopPropagation prevents the inside click from also closing the modal. */}
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            {/* Title changes between Create and Edit. */}
            <h3>{editId ? 'Edit Habit' : 'Create New Habit'}</h3>
            <form className="habit-form" onSubmit={handleSubmit} style={{ marginTop: 'var(--space-md)' }}>
              {/* Each form group is a label + a controlled input bound to the form state. */}
              <div className="form-group">
                <label className="form-label">Habit Name</label>
                {/* Spread current state and overwrite the changed field. */}
                <input className="form-input" placeholder="e.g., Morning Meditation" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Goal</label>
                <input className="form-input" placeholder="e.g., 10 minutes" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} required />
              </div>

              {/* Optional note / description. */}
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <textarea className="form-input" placeholder="Why is this important to you?" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <select className="form-select" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                {/* Reminder time used by the Notification API. */}
                <div className="form-group">
                  <label className="form-label">Reminder Time</label>
                  <input type="time" className="form-input" value={form.reminderTime} onChange={e => setForm({ ...form, reminderTime: e.target.value })} />
                </div>
                {/* Weekly completion goal (1..7). */}
                <div className="form-group">
                  <label className="form-label">Weekly Goal (times)</label>
                  <input type="number" min="1" max="7" className="form-input" value={form.weeklyGoal} onChange={e => setForm({ ...form, weeklyGoal: e.target.value })} />
                </div>
              </div>

              {/* Tag input — user types a comma-separated list. */}
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input className="form-input" placeholder="morning, important, quick" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>

              {/* Color picker: preset swatches + a native color input for any color. */}
              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div className="color-swatches">
                  {COLOR_PRESETS.map(c => (
                    <button
                      type="button" key={c}
                      className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
                      // aria-label: read by screen readers since the button has no text.
                      aria-label={`Pick ${c}`}
                    />
                  ))}
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="color-native" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Update' : 'Create'} Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state when there are no visible (non-archived) habits. */}
      {visible.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <h3>No habits yet</h3>
            <p>Create your first habit to start building consistency.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={() => setShowForm(true)}>Create First Habit</button>
          </div>
        </div>
      ) : (
        <div className="habits-list">
          {/* Render one card per visible habit. */}
          {visible.map(habit => (
            <div className="habit-card" key={habit.id}>
              {/* Color stripe along the left edge. */}
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">
                  {habit.name}
                  {/* Show a 📝 icon if a note exists. `title` shows it on hover. */}
                  {habit.note && <span className="note-icon" title={habit.note}>📝</span>}
                </div>
                <div className="habit-card-details">
                  <span>🎯 {habit.goal}</span>
                  <span>📅 {habit.frequency}</span>
                  <span>⏰ {habit.time}</span>
                  {habit.reminderTime && <span>🔔 {habit.reminderTime}</span>}
                </div>
                {/* Render tag pills only if the habit has any. */}
                {habit.tags && habit.tags.length > 0 && (
                  <div className="habit-tags">
                    {habit.tags.map(t => <span key={t} className="tag-pill">#{t}</span>)}
                  </div>
                )}
              </div>
              {/* Streak counter on the right side. */}
              <div className="habit-card-streak">🔥 {habit.streak}</div>
              <div className="habit-card-actions">
                {/* Pencil opens the modal pre-filled with this habit. */}
                <button className="icon-btn" onClick={() => handleEdit(habit)} title="Edit">✏️</button>
                {/* Box archives the habit (moves it to the Archive page). */}
                <button className="icon-btn" onClick={() => archiveHabit(habit.id)} title="Archive">📦</button>
                {/* Trash removes the habit forever. */}
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

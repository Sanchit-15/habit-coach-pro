import { useState } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
import './MyHabits.css';

// Preset color swatches users can pick
const COLOR_PRESETS = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C', '#E91E63', '#34495E'];

export default function MyHabits() {
  const { habits, addHabit, updateHabit, deleteHabit, archiveHabit } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', goal: '', frequency: 'daily', time: 'morning',
    note: '', color: COLOR_PRESETS[0], reminderTime: '', weeklyGoal: 7, tags: '',
  });

  const resetForm = () => {
    setForm({ name: '', goal: '', frequency: 'daily', time: 'morning', note: '', color: COLOR_PRESETS[0], reminderTime: '', weeklyGoal: 7, tags: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert comma-separated tag string into array of trimmed lowercase tags
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { ...form, tags, weeklyGoal: Number(form.weeklyGoal) || 7 };
    if (editId) updateHabit(editId, payload);
    else addHabit(payload);
    resetForm();
  };

  const handleEdit = (habit) => {
    setForm({
      name: habit.name, goal: habit.goal, frequency: habit.frequency, time: habit.time,
      note: habit.note || '', color: habit.color || COLOR_PRESETS[0],
      reminderTime: habit.reminderTime || '', weeklyGoal: habit.weeklyGoal ?? 7,
      tags: (habit.tags || []).join(', '),
    });
    setEditId(habit.id);
    setShowForm(true);
  };

  // Show only non-archived habits on this page
  const visible = habits.filter(h => !h.archived);

  return (
    <div className="habits-page">
      <div className="habits-header">
        <div className="page-header">
          <h1>My Habits</h1>
          <p>Create, manage, and track your daily habits.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Habit</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>{editId ? 'Edit Habit' : 'Create New Habit'}</h3>
            <form className="habit-form" onSubmit={handleSubmit} style={{ marginTop: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Habit Name</label>
                <input className="form-input" placeholder="e.g., Morning Meditation" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Goal</label>
                <input className="form-input" placeholder="e.g., 10 minutes" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} required />
              </div>

              {/* Optional note / description */}
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
                {/* Reminder time used by Notification API */}
                <div className="form-group">
                  <label className="form-label">Reminder Time</label>
                  <input type="time" className="form-input" value={form.reminderTime} onChange={e => setForm({ ...form, reminderTime: e.target.value })} />
                </div>
                {/* Weekly completion goal */}
                <div className="form-group">
                  <label className="form-label">Weekly Goal (times)</label>
                  <input type="number" min="1" max="7" className="form-input" value={form.weeklyGoal} onChange={e => setForm({ ...form, weeklyGoal: e.target.value })} />
                </div>
              </div>

              {/* Tag input — comma separated */}
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input className="form-input" placeholder="morning, important, quick" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>

              {/* Color picker */}
              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div className="color-swatches">
                  {COLOR_PRESETS.map(c => (
                    <button
                      type="button" key={c}
                      className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
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
          {visible.map(habit => (
            <div className="habit-card" key={habit.id}>
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">
                  {habit.name}
                  {habit.note && <span className="note-icon" title={habit.note}>📝</span>}
                </div>
                <div className="habit-card-details">
                  <span>🎯 {habit.goal}</span>
                  <span>📅 {habit.frequency}</span>
                  <span>⏰ {habit.time}</span>
                  {habit.reminderTime && <span>🔔 {habit.reminderTime}</span>}
                </div>
                {habit.tags && habit.tags.length > 0 && (
                  <div className="habit-tags">
                    {habit.tags.map(t => <span key={t} className="tag-pill">#{t}</span>)}
                  </div>
                )}
              </div>
              <div className="habit-card-streak">🔥 {habit.streak}</div>
              <div className="habit-card-actions">
                <button className="icon-btn" onClick={() => handleEdit(habit)} title="Edit">✏️</button>
                <button className="icon-btn" onClick={() => archiveHabit(habit.id)} title="Archive">📦</button>
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

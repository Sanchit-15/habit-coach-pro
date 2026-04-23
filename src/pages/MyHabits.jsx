import { useState } from 'react';
import { useHabits, CATEGORIES, PRIORITIES, CATEGORY_COLORS, PRIORITY_COLORS } from '../context/HabitContext.jsx';
import { requestNotificationPermission } from '../hooks/useReminders.js';
import './MyHabits.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Preset palette for the color picker — users can also type any HEX
const COLOR_PRESETS = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C', '#FF6B9D', '#34495E'];

// Empty form template — used when opening the form fresh
const emptyForm = {
  name: '', goal: '', frequency: 'daily', time: 'morning',
  category: 'Personal', priority: 'medium', customDays: [],
  notes: '', reminderTime: '', color: '#2F80ED',
  weeklyGoal: 7, tags: [],
};

export default function MyHabits() {
  const { habits, addHabit, updateHabit, deleteHabit, archiveHabit } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  // Holds the in-progress text typed into the tag input before pressing Enter
  const [tagInput, setTagInput] = useState('');

  // Show only non-archived habits on this page
  const visibleHabits = habits.filter(h => !h.archived);

  const resetForm = () => {
    setForm(emptyForm);
    setTagInput('');
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) updateHabit(editId, form);
    else addHabit(form);
    // If user set a reminder time, ask for notification permission once
    if (form.reminderTime) requestNotificationPermission();
    resetForm();
  };

  const handleEdit = (habit) => {
    setForm({
      name: habit.name,
      goal: habit.goal || '',
      frequency: habit.frequency || 'daily',
      time: habit.time || 'morning',
      category: habit.category || 'Personal',
      priority: habit.priority || 'medium',
      customDays: habit.customDays || [],
      notes: habit.notes || '',
      reminderTime: habit.reminderTime || '',
      color: habit.color || '#2F80ED',
      weeklyGoal: habit.weeklyGoal || 7,
      tags: habit.tags || [],
    });
    setEditId(habit.id);
    setShowForm(true);
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      customDays: f.customDays.includes(day) ? f.customDays.filter(d => d !== day) : [...f.customDays, day],
    }));
  };

  // Add a tag from the input field; ignore duplicates and blanks
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t)) { setTagInput(''); return; }
    setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
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
              {form.frequency === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Repeat on</label>
                  <div className="day-picker">
                    {DAYS.map(d => (
                      <button type="button" key={d} className={`day-chip ${form.customDays.includes(d) ? 'active' : ''}`} onClick={() => toggleDay(d)}>{d}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminder time + weekly goal share a row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reminder time (optional)</label>
                  <input type="time" className="form-input" value={form.reminderTime} onChange={e => setForm({ ...form, reminderTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weekly goal (1–7 days)</label>
                  <input type="number" min="1" max="7" className="form-input" value={form.weeklyGoal} onChange={e => setForm({ ...form, weeklyGoal: Math.max(1, Math.min(7, +e.target.value || 1)) })} />
                </div>
              </div>

              {/* Color picker — preset swatches plus a free-form picker */}
              <div className="form-group">
                <label className="form-label">Accent color</label>
                <div className="color-picker">
                  {COLOR_PRESETS.map(c => (
                    <button type="button" key={c} className={`color-swatch ${form.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} title={c} />
                  ))}
                  <input type="color" className="color-native" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} title="Custom color" />
                </div>
              </div>

              {/* Optional notes / description */}
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input" rows="2" placeholder="Why this matters, tips, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* Tags input — type and press Enter to add */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tag-input-row">
                  <input
                    className="form-input"
                    placeholder="e.g., morning, important"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addTag}>Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="tag-list" style={{ marginTop: 'var(--space-sm)' }}>
                    {form.tags.map(t => (
                      <span key={t} className="tag-pill">
                        #{t}
                        <button type="button" className="tag-pill-x" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Update' : 'Create'} Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {visibleHabits.length === 0 ? (
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
          {visibleHabits.map(habit => (
            <div className="habit-card" key={habit.id} style={{ borderLeft: `4px solid ${habit.color}` }}>
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">
                  {habit.name}
                  <span className="priority-dot" style={{ background: PRIORITY_COLORS[habit.priority] || '#9CA3AF' }} title={`${habit.priority} priority`} />
                  {/* Note icon — shows note text in a native tooltip when present */}
                  {habit.notes && (
                    <span className="note-icon" title={habit.notes}>📝</span>
                  )}
                </div>
                <div className="habit-card-details">
                  <span
                    className="category-badge"
                    style={{
                      background: (CATEGORY_COLORS[habit.category] || '#9CA3AF') + '22',
                      color: CATEGORY_COLORS[habit.category] || '#6B7280',
                    }}
                  >{habit.category || 'Personal'}</span>
                  <span>🎯 {habit.goal}</span>
                  <span>📅 {habit.frequency}{habit.frequency === 'custom' && habit.customDays?.length ? ` (${habit.customDays.join(', ')})` : ''}</span>
                  <span>⏰ {habit.time}</span>
                  {habit.reminderTime && <span>🔔 {habit.reminderTime}</span>}
                </div>
                {habit.tags?.length > 0 && (
                  <div className="tag-list" style={{ marginTop: 'var(--space-xs)' }}>
                    {habit.tags.map(t => <span key={t} className="tag-pill small">#{t}</span>)}
                  </div>
                )}
              </div>
              <div className="habit-card-streak">🔥 {habit.streak}</div>
              <div className="habit-card-actions">
                <button className="icon-btn" onClick={() => handleEdit(habit)} title="Edit">✏️</button>
                <button className="icon-btn" onClick={() => archiveHabit(habit.id, true)} title="Archive">📦</button>
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

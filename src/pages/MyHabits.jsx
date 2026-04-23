import { useState } from 'react';
import { useHabits, CATEGORIES, PRIORITIES, CATEGORY_COLORS, PRIORITY_COLORS } from '../context/HabitContext.jsx';
import './MyHabits.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MyHabits() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', goal: '', frequency: 'daily', time: 'morning',
    category: 'Personal', priority: 'medium', customDays: [],
  });

  const resetForm = () => {
    setForm({ name: '', goal: '', frequency: 'daily', time: 'morning', category: 'Personal', priority: 'medium', customDays: [] });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) updateHabit(editId, form);
    else addHabit(form);
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
    });
    setEditId(habit.id);
    setShowForm(true);
  };

  // Toggle a day in custom-days array
  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      customDays: f.customDays.includes(day)
        ? f.customDays.filter(d => d !== day)
        : [...f.customDays, day],
    }));
  };

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
                      <button
                        type="button"
                        key={d}
                        className={`day-chip ${form.customDays.includes(d) ? 'active' : ''}`}
                        onClick={() => toggleDay(d)}
                      >{d}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Update' : 'Create'} Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
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
          {habits.map(habit => (
            <div className="habit-card" key={habit.id}>
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">
                  {habit.name}
                  {/* Priority dot */}
                  <span
                    className="priority-dot"
                    style={{ background: PRIORITY_COLORS[habit.priority] || '#9CA3AF' }}
                    title={`${habit.priority} priority`}
                  />
                </div>
                <div className="habit-card-details">
                  {/* Category badge */}
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
                </div>
              </div>
              <div className="habit-card-streak">🔥 {habit.streak}</div>
              <div className="habit-card-actions">
                <button className="icon-btn" onClick={() => handleEdit(habit)} title="Edit">✏️</button>
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

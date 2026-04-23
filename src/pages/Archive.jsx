import { useHabits, CATEGORY_COLORS, PRIORITY_COLORS } from '../context/HabitContext.jsx';
import { Link } from 'react-router-dom';
import './MyHabits.css';

// Dedicated page that lists archived habits with a Restore button
export default function Archive() {
  const { habits, archiveHabit, deleteHabit } = useHabits();
  // Only show archived habits here
  const archived = habits.filter(h => h.archived);

  return (
    <div className="habits-page">
      <div className="habits-header">
        <div className="page-header">
          <h1>Archive</h1>
          <p>Habits you've put on pause. Restore them anytime.</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline btn-sm">← Back to Dashboard</Link>
      </div>

      {archived.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No archived habits</h3>
            <p>When you archive a habit it will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="habits-list">
          {archived.map(habit => (
            <div className="habit-card" key={habit.id} style={{ borderLeft: `4px solid ${habit.color}`, opacity: 0.85 }}>
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">
                  {habit.name}
                  <span className="priority-dot" style={{ background: PRIORITY_COLORS[habit.priority] || '#9CA3AF' }} title={`${habit.priority} priority`} />
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
                  <span>📅 {habit.frequency}</span>
                </div>
              </div>
              <div className="habit-card-actions">
                <button className="btn btn-primary btn-sm" onClick={() => archiveHabit(habit.id, false)}>↩ Restore</button>
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete forever">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

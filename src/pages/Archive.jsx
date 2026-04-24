import { useHabits } from '../context/HabitContext.jsx';
import './MyHabits.css';

// Page that lists archived habits with a Restore action
export default function Archive() {
  const { habits, restoreHabit, deleteHabit } = useHabits();
  const archived = habits.filter(h => h.archived);

  return (
    <div className="habits-page">
      <div className="page-header">
        <h1>Archive</h1>
        <p>Habits you've put aside. Restore them anytime.</p>
      </div>

      {archived.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>Nothing archived yet</h3>
            <p>Habits you archive will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="habits-list">
          {archived.map(habit => (
            <div className="habit-card" key={habit.id}>
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">{habit.name}</div>
                <div className="habit-card-details">
                  <span>🎯 {habit.goal}</span>
                  <span>🔥 {habit.streak} streak</span>
                </div>
              </div>
              <div className="habit-card-actions">
                <button className="btn btn-primary btn-sm" onClick={() => restoreHabit(habit.id)}>♻️ Restore</button>
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete forever">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

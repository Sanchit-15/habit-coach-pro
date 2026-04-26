// ===========================================================================
// Archive.jsx — Page that lists habits the user has archived.
// Lets them either Restore (move back to active) or Delete forever.
// ===========================================================================

// Pull habit data + the restore/delete actions from the global context.
import { useHabits } from '../context/HabitContext.jsx';
// Reuse styles from the My Habits page (similar card layout).
import './MyHabits.css';

export default function Archive() {
  // Destructure exactly the bits of context we use.
  const { habits, restoreHabit, deleteHabit } = useHabits();
  // .filter() returns a NEW array containing only items where archived is true.
  const archived = habits.filter(h => h.archived);

  return (
    <div className="habits-page">
      <div className="page-header">
        <h1>Archive</h1>
        <p>Habits you've put aside. Restore them anytime.</p>
      </div>

      {/* Ternary: if no archived habits, show a friendly empty state. */}
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
          {/* Render one card per archived habit. */}
          {archived.map(habit => (
            <div className="habit-card" key={habit.id}>
              {/* Left color stripe matching the habit's chosen color. */}
              <div className="habit-card-color" style={{ background: habit.color }} />
              <div className="habit-card-body">
                <div className="habit-card-name">{habit.name}</div>
                <div className="habit-card-details">
                  <span>🎯 {habit.goal}</span>
                  <span>🔥 {habit.streak} streak</span>
                </div>
              </div>
              <div className="habit-card-actions">
                {/* Restore puts the habit back on the dashboard. */}
                <button className="btn btn-primary btn-sm" onClick={() => restoreHabit(habit.id)}>♻️ Restore</button>
                {/* Delete removes the habit permanently. */}
                <button className="icon-btn delete" onClick={() => deleteHabit(habit.id)} title="Delete forever">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

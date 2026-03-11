import { useHabits } from '../context/HabitContext.jsx';
import './Reports.css';

export default function Reports() {
  const { habits } = useHabits();

  const allCompletions = habits.flatMap(h => h.completions);
  const totalDone = allCompletions.filter(c => c.status === 'done').length;
  const totalMissed = allCompletions.filter(c => c.status === 'missed').length;
  const totalEntries = allCompletions.length;
  const overallRate = totalEntries > 0 ? Math.round((totalDone / totalEntries) * 100) : 0;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const bestHabit = habits.reduce((a, b) => a.streak > b.streak ? a : b, habits[0]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMisses = Array(7).fill(0);
  allCompletions.forEach(c => {
    if (c.status === 'missed') dayMisses[new Date(c.date).getDay()]++;
  });
  const hardestDay = dayNames[dayMisses.indexOf(Math.max(...dayMisses))];

  const reasonCounts = {};
  allCompletions.forEach(c => { if (c.reason) reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1; });
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const weekDone = allCompletions.filter(c => last7.includes(c.date) && c.status === 'done').length;
  const weekTotal = allCompletions.filter(c => last7.includes(c.date)).length;
  const weekRate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Summary of your habit performance and progress.</p>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon" style={{ background: 'var(--info-bg)' }}>📊</div>
            <div className="report-card-title">Weekly Summary</div>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Completion Rate</span>
            <span className="report-stat-value" style={{ color: 'var(--success)' }}>{weekRate}%</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Habits Completed</span>
            <span className="report-stat-value">{weekDone}</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Habits Missed</span>
            <span className="report-stat-value" style={{ color: 'var(--danger)' }}>{weekTotal - weekDone}</span>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon" style={{ background: 'var(--primary-bg)' }}>📅</div>
            <div className="report-card-title">Monthly Summary</div>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Overall Rate</span>
            <span className="report-stat-value" style={{ color: 'var(--success)' }}>{overallRate}%</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Total Completed</span>
            <span className="report-stat-value">{totalDone}</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Total Missed</span>
            <span className="report-stat-value" style={{ color: 'var(--danger)' }}>{totalMissed}</span>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon" style={{ background: 'var(--success-bg)' }}>🏆</div>
            <div className="report-card-title">Best Performance</div>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Best Streak</span>
            <span className="report-stat-value" style={{ color: 'var(--primary)' }}>{bestStreak} days 🔥</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Best Habit</span>
            <span className="report-stat-value">{bestHabit?.name || 'N/A'}</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Active Habits</span>
            <span className="report-stat-value">{habits.length}</span>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <div className="report-card-icon" style={{ background: 'var(--danger-bg)' }}>⚠️</div>
            <div className="report-card-title">Challenges</div>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Hardest Day</span>
            <span className="report-stat-value">{hardestDay}</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Top Failure Reason</span>
            <span className="report-stat-value">{topReason}</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Miss Rate</span>
            <span className="report-stat-value" style={{ color: 'var(--danger)' }}>{totalEntries > 0 ? Math.round((totalMissed / totalEntries) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      <div className="download-section">
        <h3>📥 Download Report</h3>
        <p>Get a detailed PDF report of your habit performance, streaks, and insights.</p>
        <button className="btn btn-primary" onClick={() => alert('PDF download feature coming soon!')}>Download PDF Report</button>
      </div>
    </div>
  );
}

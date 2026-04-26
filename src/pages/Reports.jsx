// ===========================================================================
// Reports.jsx — Plain-text summary of habit performance + a "Download PDF"
// placeholder. No charts; just calculated numbers shown in cards.
// ===========================================================================

import { useHabits } from '../context/HabitContext.jsx';
import './Reports.css';

export default function Reports() {
  // Pull the habits array from the global habit context.
  const { habits } = useHabits();

  // .flatMap merges each habit's completions array into one big array.
  // Example: [[a,b],[c]] -> [a,b,c]
  const allCompletions = habits.flatMap(h => h.completions);
  // Count of completions marked done.
  const totalDone = allCompletions.filter(c => c.status === 'done').length;
  // Count of completions marked missed.
  const totalMissed = allCompletions.filter(c => c.status === 'missed').length;
  // Total entries (done + missed + excused).
  const totalEntries = allCompletions.length;
  // Overall % completion. Guard divide-by-zero.
  const overallRate = totalEntries > 0 ? Math.round((totalDone / totalEntries) * 100) : 0;
  // Highest current streak across all habits. The 0 makes Math.max safe when empty.
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  // The habit object with the highest streak (or first if tied).
  const bestHabit = habits.reduce((a, b) => a.streak > b.streak ? a : b, habits[0]);

  // Find the day of the week with the most misses.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Array(7).fill(0) creates [0,0,0,0,0,0,0] — one bucket per weekday.
  const dayMisses = Array(7).fill(0);
  allCompletions.forEach(c => {
    // For every miss, bump the bucket matching its weekday.
    if (c.status === 'missed') dayMisses[new Date(c.date).getDay()]++;
  });
  // .indexOf(Math.max(...)) finds which weekday had the most misses.
  const hardestDay = dayNames[dayMisses.indexOf(Math.max(...dayMisses))];

  // Tally each "miss reason" so we can highlight the most common one.
  const reasonCounts = {};
  allCompletions.forEach(c => { if (c.reason) reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1; });
  // Object.entries -> [['Busy', 4], ['Tired', 2], ...]; sort descending by count.
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Build an array of YYYY-MM-DD strings for the past 7 days (today + 6 back).
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  // Count "done" completions whose date falls within the last 7 days.
  const weekDone = allCompletions.filter(c => last7.includes(c.date) && c.status === 'done').length;
  // Total entries in the last 7 days.
  const weekTotal = allCompletions.filter(c => last7.includes(c.date)).length;
  // Weekly completion rate (or 0 when no entries).
  const weekRate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Summary of your habit performance and progress.</p>
      </div>

      {/* Grid of 4 stat cards. Each card is just labels + values. */}
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
            {/* Safe: ?. avoids crashing if bestHabit is undefined. */}
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

      {/* Placeholder download button — alert() shows a quick browser popup. */}
      <div className="download-section">
        <h3>📥 Download Report</h3>
        <p>Get a detailed PDF report of your habit performance, streaks, and insights.</p>
        <button className="btn btn-primary" onClick={() => alert('PDF download feature coming soon!')}>Download PDF Report</button>
      </div>
    </div>
  );
}

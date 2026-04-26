// ===========================================================================
// Analytics.jsx — Visual charts powered by the Recharts library.
// Shows: weekly completions, monthly streak trend, 28-day heatmap,
// failure-reason pie chart, and best vs. worst day comparison.
// ===========================================================================

// Pull habit data from the global habit context.
import { useHabits } from '../context/HabitContext.jsx';
// Recharts is a chart library. We import only the pieces we need.
// - BarChart, Bar     → bar chart
// - LineChart, Line   → line chart
// - PieChart, Pie     → pie chart
// - XAxis, YAxis      → chart axes
// - Tooltip           → hover tooltip
// - ResponsiveContainer → makes charts scale with container width
// - Cell              → individual slice color in a Pie
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
// Page-specific styles (heatmap grid, layout).
import './Analytics.css';

// Pie slice color palette — index loops through these.
const COLORS = ['#E8553A', '#F5A623', '#2F80ED', '#27AE60', '#9B59B6', '#EB5757'];
// Short names used for the "best/worst day" labels.
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  // Read the habits list from context.
  const { habits } = useHabits();

  // ---------- Build weekly completion data (Mon..Sun of current week) ----------
  // .map turns each day name into an object { day, completed, total }.
  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const d = new Date();
    // getDay(): 0 = Sun, 1 = Mon ... treat Sun as 7 so Monday is index 1.
    const dayOfWeek = d.getDay();
    // Days back from today to land on the target weekday.
    const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (i + 1);
    const target = new Date(d);
    target.setDate(d.getDate() - diff);
    // ISO date string we can compare against habit completion dates.
    const dateStr = target.toISOString().split('T')[0];
    // Count habits that have a "done" entry for this date.
    const done = habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    return { day, completed: done, total: habits.length };
  });

  // ---------- Monthly streak: how many "done" entries each of the last 4 weeks ----------
  const monthlyData = Array.from({ length: 4 }, (_, w) => {
    let done = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      // Go back (w*7 + d) days to walk through the past 4 weeks day by day.
      date.setDate(date.getDate() - (w * 7 + d));
      const dateStr = date.toISOString().split('T')[0];
      done += habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    }
    return { week: `Week ${4 - w}`, streak: done };
    // Reverse so the chart goes oldest → newest left to right.
  }).reverse();

  // ---------- Pie chart of failure reasons ----------
  const reasonCounts = {}; // object used as a counter map
  habits.forEach(h => h.completions.forEach(c => {
    if (c.status === 'missed' && c.reason) {
      reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
    }
  }));
  // Convert { reason: count } into [{ name, value }] which Recharts expects.
  const pieData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

  // ---------- Heatmap (last 28 days) ----------
  const heatmapData = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split('T')[0];
    const done = habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    // ratio = fraction of habits done that day (0..1).
    const ratio = habits.length > 0 ? done / habits.length : 0;
    return { date: dateStr, ratio };
  });

  // Map a 0..1 ratio to a CSS background color for heatmap cells.
  const getHeatColor = (ratio) => {
    if (ratio === 0) return 'var(--border-light)';
    if (ratio < 0.33) return '#fecaca';
    if (ratio < 0.66) return '#fdba74';
    if (ratio < 1) return '#86efac';
    return '#22c55e';
  };

  // ---------- Best day vs. worst day (by completion rate per weekday) ----------
  const dayScores = Array.from({ length: 7 }, (_, i) => {
    let done = 0, total = 0;
    habits.forEach(h => h.completions.forEach(c => {
      const d = new Date(c.date).getDay();
      if (d === i) { total++; if (c.status === 'done') done++; }
    }));
    return { day: dayNames[i], rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  });
  // .reduce walks the array, returning the day with the highest/lowest rate.
  const bestDay = dayScores.reduce((a, b) => a.rate > b.rate ? a : b);
  const worstDay = dayScores.reduce((a, b) => a.rate < b.rate ? a : b);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Visualize your habit data and discover patterns.</p>
      </div>

      <div className="charts-grid">
        {/* WEEKLY BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-title">📊 Weekly Completion</div>
          {/* ResponsiveContainer makes the chart fill its parent's width. */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MONTHLY LINE CHART */}
        <div className="chart-card">
          <div className="chart-card-title">📈 Monthly Streak Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="streak" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HEATMAP — built with plain divs colored by ratio. */}
        <div className="chart-card">
          <div className="chart-card-title">🗓️ Success Heatmap (Last 28 Days)</div>
          <div className="heatmap-labels">
            {/* Day-of-week column headers. */}
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span className="heatmap-label" key={i}>{d}</span>)}
          </div>
          <div className="heatmap">
            {/* One cell per day; `title` is the native browser tooltip on hover. */}
            {heatmapData.map(d => (
              <div key={d.date} className="heatmap-cell" style={{ background: getHeatColor(d.ratio) }} title={`${d.date}: ${Math.round(d.ratio * 100)}%`} />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            {/* Show the color scale legend. */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => <div key={v} className="heatmap-legend-item" style={{ background: getHeatColor(v) }} />)}
            <span>More</span>
          </div>
        </div>

        {/* PIE CHART of miss reasons. */}
        <div className="chart-card">
          <div className="chart-card-title">🥧 Failure Reasons</div>
          {/* Only render the chart if we have reasons; else show a friendly note. */}
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {/* One <Cell> per slice gives each its own color. */}
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No missed habits yet! 🎉</div>
          )}
        </div>

        {/* BEST vs WORST day comparison card. */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-card-title">🏆 Best Day vs Worst Day</div>
          <div className="comparison-cards">
            <div className="comparison-card best">
              <div className="comparison-label">Best Day</div>
              <div className="comparison-value" style={{ color: 'var(--success)' }}>{bestDay.day}</div>
              <div className="comparison-sub">{bestDay.rate}% completion rate</div>
            </div>
            <div className="comparison-card worst">
              <div className="comparison-label">Most Challenging</div>
              <div className="comparison-value" style={{ color: 'var(--danger)' }}>{worstDay.day}</div>
              <div className="comparison-sub">{worstDay.rate}% completion rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

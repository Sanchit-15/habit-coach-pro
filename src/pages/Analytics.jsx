import { useHabits } from '../context/HabitContext.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

const COLORS = ['#E8553A', '#F5A623', '#2F80ED', '#27AE60', '#9B59B6', '#EB5757'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const { habits } = useHabits();

  // Weekly completion data
  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const diff = (dayOfWeek === 0 ? 7 : dayOfWeek) - (i + 1);
    const target = new Date(d);
    target.setDate(d.getDate() - diff);
    const dateStr = target.toISOString().split('T')[0];
    const done = habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    return { day, completed: done, total: habits.length };
  });

  // Monthly streak (last 4 weeks)
  const monthlyData = Array.from({ length: 4 }, (_, w) => {
    let done = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() - (w * 7 + d));
      const dateStr = date.toISOString().split('T')[0];
      done += habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    }
    return { week: `Week ${4 - w}`, streak: done };
  }).reverse();

  // Failure reasons pie
  const reasonCounts = {};
  habits.forEach(h => h.completions.forEach(c => {
    if (c.status === 'missed' && c.reason) {
      reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
    }
  }));
  const pieData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

  // Heatmap data (last 28 days)
  const heatmapData = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split('T')[0];
    const done = habits.filter(h => h.completions.some(c => c.date === dateStr && c.status === 'done')).length;
    const ratio = habits.length > 0 ? done / habits.length : 0;
    return { date: dateStr, ratio };
  });

  const getHeatColor = (ratio) => {
    if (ratio === 0) return 'var(--border-light)';
    if (ratio < 0.33) return '#fecaca';
    if (ratio < 0.66) return '#fdba74';
    if (ratio < 1) return '#86efac';
    return '#22c55e';
  };

  // Best/worst day
  const dayScores = Array.from({ length: 7 }, (_, i) => {
    let done = 0, total = 0;
    habits.forEach(h => h.completions.forEach(c => {
      const d = new Date(c.date).getDay();
      if (d === i) { total++; if (c.status === 'done') done++; }
    }));
    return { day: dayNames[i], rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  });
  const bestDay = dayScores.reduce((a, b) => a.rate > b.rate ? a : b);
  const worstDay = dayScores.reduce((a, b) => a.rate < b.rate ? a : b);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Visualize your habit data and discover patterns.</p>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">📊 Weekly Completion</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

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

        <div className="chart-card">
          <div className="chart-card-title">🗓️ Success Heatmap (Last 28 Days)</div>
          <div className="heatmap-labels">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span className="heatmap-label" key={i}>{d}</span>)}
          </div>
          <div className="heatmap">
            {heatmapData.map(d => (
              <div key={d.date} className="heatmap-cell" style={{ background: getHeatColor(d.ratio) }} title={`${d.date}: ${Math.round(d.ratio * 100)}%`} />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map(v => <div key={v} className="heatmap-legend-item" style={{ background: getHeatColor(v) }} />)}
            <span>More</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">🥧 Failure Reasons</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No missed habits yet! 🎉</div>
          )}
        </div>

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

import { useHabits } from '../context/HabitContext.jsx';
import './Insights.css';

export default function Insights() {
  const { habits } = useHabits();

  // Calculate insights from data
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = Array(7).fill(0);
  const dayMisses = Array(7).fill(0);
  habits.forEach(h => h.completions.forEach(c => {
    const d = new Date(c.date).getDay();
    if (c.status === 'missed') dayMisses[d]++;
    dayCounts[d]++;
  }));
  const worstDayIdx = dayMisses.indexOf(Math.max(...dayMisses));
  const worstDay = dayNames[worstDayIdx];

  const avgStreak = habits.length > 0 ? Math.round(habits.reduce((s, h) => s + h.streak, 0) / habits.length) : 0;

  const morningHabits = habits.filter(h => h.time === 'morning');
  const morningRate = morningHabits.length > 0 
    ? Math.round(morningHabits.reduce((s, h) => {
        const done = h.completions.filter(c => c.status === 'done').length;
        return s + (h.completions.length > 0 ? (done / h.completions.length) * 100 : 0);
      }, 0) / morningHabits.length) 
    : 0;

  const topReason = {};
  habits.forEach(h => h.completions.forEach(c => {
    if (c.reason) topReason[c.reason] = (topReason[c.reason] || 0) + 1;
  }));
  const mainReason = Object.entries(topReason).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const insights = [
    {
      icon: '📅', bg: 'var(--info-bg)', tag: 'Pattern', tagBg: 'var(--info-bg)', tagColor: 'var(--info)',
      title: `You miss habits most on ${worstDay}s.`,
      body: `Our data shows that ${worstDay} is consistently your most challenging day for habit completion. Understanding this pattern is the first step to overcoming it.`,
      suggestion: { icon: '💡', text: `Plan lighter habits for ${worstDay}s`, desc: 'Reduce friction by setting easier goals on your challenging days.' }
    },
    {
      icon: '🔥', bg: 'var(--primary-bg)', tag: 'Streak', tagBg: 'var(--primary-bg)', tagColor: 'var(--primary)',
      title: `Your streak usually breaks after ${avgStreak} days.`,
      body: `Most of your habit streaks end around the ${avgStreak}-day mark. This is a critical point where extra motivation can make a difference.`,
      suggestion: { icon: '🎯', text: 'Set a milestone reward at day ' + (avgStreak + 3), desc: 'Having something to look forward to can push you past your typical breaking point.' }
    },
    {
      icon: '🌅', bg: 'var(--success-bg)', tag: 'Timing', tagBg: 'var(--success-bg)', tagColor: 'var(--success)',
      title: `Morning completion rate is ${morningRate}%.`,
      body: 'Habits scheduled in the morning tend to have higher completion rates. Your willpower is typically strongest early in the day.',
      suggestion: { icon: '⏰', text: 'Try moving challenging habits to the morning', desc: 'Tackle your hardest habits when your discipline is at its peak.' }
    },
    {
      icon: '⚠️', bg: 'var(--accent-bg)', tag: 'Reason', tagBg: 'var(--accent-bg)', tagColor: 'var(--accent)',
      title: `"${mainReason}" is your most common reason for missing habits.`,
      body: `When you miss a habit, "${mainReason}" comes up most frequently. Addressing this root cause could significantly improve your consistency.`,
      suggestion: { icon: '🛡️', text: `Create a plan for when you feel "${mainReason.toLowerCase()}"`, desc: 'Having a pre-planned response removes decision fatigue in the moment.' }
    },
  ];

  // Summary stats for the insights page
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.filter(c => c.status === 'done').length, 0);

  return (
    <div className="insights-page">
      <div className="page-header">
        <h1>Insights</h1>
        <p>AI-powered observations to help you build better habits.</p>
      </div>

      {/* Summary stats cards */}
      <div className="insights-summary">
        <div className="summary-card">
          <div className="summary-value">{totalHabits}</div>
          <div className="summary-label">Total Habits</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{totalCompletions}</div>
          <div className="summary-label">Total Completions</div>
        </div>
        {habits.map(h => (
          <div className="summary-card" key={h.id}>
            <div className="summary-value">🔥 {h.streak}</div>
            <div className="summary-label">{h.name}</div>
          </div>
        ))}
      </div>

      <div className="insights-grid">
        {insights.map((insight, i) => (
          <div className="insight-card" key={i}>
            <div className="insight-header">
              <div className="insight-icon" style={{ background: insight.bg }}>{insight.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="insight-title">{insight.title}</div>
              </div>
              <span className="insight-tag" style={{ background: insight.tagBg, color: insight.tagColor }}>{insight.tag}</span>
            </div>
            <div className="insight-body">{insight.body}</div>
            <div className="suggestion-card">
              <span className="suggestion-icon">{insight.suggestion.icon}</span>
              <div>
                <div className="suggestion-text">{insight.suggestion.text}</div>
                <div className="suggestion-desc">{insight.suggestion.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

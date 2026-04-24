import { useRef } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
import './Insights.css';

export default function Insights() {
  const { habits, moods, replaceData } = useHabits();
  const fileInput = useRef(null);

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
      }, 0) / morningHabits.length) : 0;
  const topReason = {};
  habits.forEach(h => h.completions.forEach(c => {
    if (c.reason) topReason[c.reason] = (topReason[c.reason] || 0) + 1;
  }));
  const mainReason = Object.entries(topReason).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const insights = [
    { icon: '📅', bg: 'var(--info-bg)', tag: 'Pattern', tagBg: 'var(--info-bg)', tagColor: 'var(--info)',
      title: `You miss habits most on ${worstDay}s.`,
      body: `Our data shows that ${worstDay} is consistently your most challenging day for habit completion.`,
      suggestion: { icon: '💡', text: `Plan lighter habits for ${worstDay}s`, desc: 'Reduce friction by setting easier goals.' } },
    { icon: '🔥', bg: 'var(--primary-bg)', tag: 'Streak', tagBg: 'var(--primary-bg)', tagColor: 'var(--primary)',
      title: `Your streak usually breaks after ${avgStreak} days.`,
      body: `Most of your streaks end around the ${avgStreak}-day mark.`,
      suggestion: { icon: '🎯', text: 'Set a milestone reward at day ' + (avgStreak + 3), desc: 'Have something to look forward to.' } },
    { icon: '🌅', bg: 'var(--success-bg)', tag: 'Timing', tagBg: 'var(--success-bg)', tagColor: 'var(--success)',
      title: `Morning completion rate is ${morningRate}%.`,
      body: 'Morning habits tend to have higher completion rates.',
      suggestion: { icon: '⏰', text: 'Move challenging habits to the morning', desc: 'Tackle hard habits when discipline is highest.' } },
    { icon: '⚠️', bg: 'var(--accent-bg)', tag: 'Reason', tagBg: 'var(--accent-bg)', tagColor: 'var(--accent)',
      title: `"${mainReason}" is your top miss reason.`,
      body: `Addressing this root cause could improve consistency.`,
      suggestion: { icon: '🛡️', text: `Plan for "${mainReason.toLowerCase()}" days`, desc: 'A pre-planned response removes decision fatigue.' } },
  ];

  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.filter(c => c.status === 'done').length, 0);

  // Past 7 days mood entries
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // Export all data as a JSON file using the Blob API
  const handleExport = () => {
    const data = { habits, moods, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consistify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Read uploaded JSON file and restore data
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        replaceData(parsed);
        alert('Data imported successfully!');
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="insights-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>Insights</h1>
          <p>AI-powered observations to help you build better habits.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExport}>⬇️ Export JSON</button>
          <button className="btn btn-outline btn-sm" onClick={() => fileInput.current?.click()}>⬆️ Import JSON</button>
          <input ref={fileInput} type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="insights-summary">
        <div className="summary-card"><div className="summary-value">{totalHabits}</div><div className="summary-label">Total Habits</div></div>
        <div className="summary-card"><div className="summary-value">{totalCompletions}</div><div className="summary-label">Total Completions</div></div>
        {habits.map(h => (
          <div className="summary-card" key={h.id}>
            <div className="summary-value">🔥 {h.streak}</div>
            <div className="summary-label">{h.name}</div>
          </div>
        ))}
      </div>

      {/* 7-day mood history */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-header">
          <div className="insight-icon" style={{ background: 'var(--accent-bg)' }}>🎭</div>
          <div className="insight-title">Mood — Past 7 Days</div>
        </div>
        <div className="mood-history">
          {last7Days.map(date => (
            <div className="mood-history-cell" key={date}>
              <div className="mood-history-emoji">{moods[date] || '·'}</div>
              <div className="mood-history-date">{date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day Consistency Map per habit */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-header">
          <div className="insight-icon" style={{ background: 'var(--success-bg)' }}>🗺️</div>
          <div className="insight-title">30-Day Consistency Map</div>
        </div>
        {habits.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Add a habit to see your map.</div>
        ) : (
          habits.map(habit => {
            // Build the last 30 calendar dates oldest → newest
            const days = Array.from({ length: 30 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              return d.toISOString().split('T')[0];
            });
            return (
              <div className="heatmap-row" key={habit.id}>
                <div className="heatmap-label">
                  <span className="heatmap-dot" style={{ background: habit.color }} />
                  {habit.name}
                </div>
                <div className="heatmap-grid">
                  {days.map(date => {
                    // Find this habit's entry for that date (if any)
                    const entry = habit.completions.find(c => c.date === date);
                    // Pick a status keyword for styling/title
                    const status = entry?.status || 'none';
                    // Use the habit color if completed, grey otherwise
                    const bg = status === 'done'
                      ? habit.color
                      : status === 'excused'
                        ? 'var(--info-bg)'
                        : status === 'missed'
                          ? 'var(--danger-bg)'
                          : 'var(--background)';
                    return (
                      <div
                        key={date}
                        className="heatmap-cell"
                        style={{ background: bg }}
                        title={`${date} — ${status}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

        {insights.map((insight, i) => (
          <div className="insight-card" key={i}>
            <div className="insight-header">
              <div className="insight-icon" style={{ background: insight.bg }}>{insight.icon}</div>
              <div style={{ flex: 1 }}><div className="insight-title">{insight.title}</div></div>
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

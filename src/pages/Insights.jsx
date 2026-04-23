import { useRef } from 'react';
import { useHabits } from '../context/HabitContext.jsx';
import './Insights.css';

export default function Insights() {
  const { habits, moods, importData } = useHabits();
  const fileInputRef = useRef(null);

  // Calculate insights from data
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMisses = Array(7).fill(0);
  habits.forEach(h => h.completions.forEach(c => {
    const d = new Date(c.date).getDay();
    if (c.status === 'missed') dayMisses[d]++;
  }));
  const worstDay = dayNames[dayMisses.indexOf(Math.max(...dayMisses))];

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
      body: `Our data shows that ${worstDay} is consistently your most challenging day for habit completion.`,
      suggestion: { icon: '💡', text: `Plan lighter habits for ${worstDay}s`, desc: 'Reduce friction by setting easier goals on your challenging days.' }
    },
    {
      icon: '🔥', bg: 'var(--primary-bg)', tag: 'Streak', tagBg: 'var(--primary-bg)', tagColor: 'var(--primary)',
      title: `Your streak usually breaks after ${avgStreak} days.`,
      body: `Most of your habit streaks end around the ${avgStreak}-day mark.`,
      suggestion: { icon: '🎯', text: 'Set a milestone reward at day ' + (avgStreak + 3), desc: 'Having something to look forward to can push you past your typical breaking point.' }
    },
    {
      icon: '🌅', bg: 'var(--success-bg)', tag: 'Timing', tagBg: 'var(--success-bg)', tagColor: 'var(--success)',
      title: `Morning completion rate is ${morningRate}%.`,
      body: 'Habits scheduled in the morning tend to have higher completion rates.',
      suggestion: { icon: '⏰', text: 'Try moving challenging habits to the morning', desc: 'Tackle your hardest habits when your discipline is at its peak.' }
    },
    {
      icon: '⚠️', bg: 'var(--accent-bg)', tag: 'Reason', tagBg: 'var(--accent-bg)', tagColor: 'var(--accent)',
      title: `"${mainReason}" is your most common reason for missing habits.`,
      body: `When you miss a habit, "${mainReason}" comes up most frequently.`,
      suggestion: { icon: '🛡️', text: `Create a plan for when you feel "${mainReason.toLowerCase()}"`, desc: 'Having a pre-planned response removes decision fatigue in the moment.' }
    },
  ];

  // Summary stats for the insights page
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.filter(c => c.status === 'done').length, 0);
  const bestStreakAll = Math.max(0, ...habits.map(h => h.streak || 0));

  // Weekly bar chart: completions per day for the past 7 days (plain CSS bars)
  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const past7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = habits.reduce(
      (s, h) => s + h.completions.filter(c => c.date === dateStr && c.status === 'done').length,
      0
    );
    past7.push({ label: weekDayLabels[d.getDay()], dateStr, count });
  }
  const maxCount = Math.max(1, ...past7.map(d => d.count));
  const weekTotal = past7.reduce((s, d) => s + d.count, 0);

  // Recent completion history per habit (last 5 done entries)
  const recentByHabit = habits.map(h => ({
    habit: h,
    recent: [...h.completions]
      .filter(c => c.status === 'done')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
  }));

  // Export everything (habits + moods) as a downloadable JSON file
  const handleExport = () => {
    const payload = { habits, moods, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consistify-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Read a user-selected file and merge it into localStorage via the context
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importData(data);
        alert('Import successful!');
      } catch (err) {
        alert('Import failed: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset value so re-selecting the same file still triggers onChange
    e.target.value = '';
  };

  return (
    <div className="insights-page">
      <div className="page-header">
        <h1>Insights</h1>
        <p>AI-powered observations to help you build better habits.</p>
      </div>

      {/* Export / Import controls */}
      <div className="export-import-row">
        <button className="btn btn-outline btn-sm" onClick={handleExport}>⬇️ Export JSON</button>
        <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>⬆️ Import JSON</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
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
        <div className="summary-card">
          <div className="summary-value">{weekTotal}</div>
          <div className="summary-label">Completions This Week</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">🔥 {bestStreakAll}</div>
          <div className="summary-label">Best Streak</div>
        </div>
      </div>

      {/* Mood history for the past 7 days */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-title" style={{ marginBottom: 'var(--space-md)' }}>😊 Mood — Last 7 Days</div>
        <div className="mood-history">
          {moodHistory.map((m, i) => (
            <div className="mood-history-cell" key={i}>
              <div className="mood-history-emoji">{m.emoji}</div>
              <div className="mood-history-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly bar chart - last 7 days, plain CSS bars */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-title" style={{ marginBottom: 'var(--space-md)' }}>📊 Completions — Last 7 Days</div>
        <div className="week-chart">
          {past7.map((d, i) => (
            <div className="week-chart-col" key={i}>
              <div className="week-chart-count">{d.count}</div>
              <div
                className="week-chart-bar"
                style={{ height: `${(d.count / maxCount) * 140}px` }}
              />
              <div className="week-chart-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-habit recent completion history */}
      {habits.length > 0 && (
        <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="insight-title" style={{ marginBottom: 'var(--space-md)' }}>📅 Recent Completion History</div>
          <div className="history-list">
            {recentByHabit.map(({ habit, recent }) => (
              <div className="history-row" key={habit.id}>
                <div className="history-habit">
                  <span className="habit-color-dot" style={{ background: habit.color, display: 'inline-block', marginRight: 8 }} />
                  {habit.name} <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>🔥 {habit.streak}</span>
                </div>
                <div className="history-dates">
                  {recent.length === 0
                    ? <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>No completions yet</span>
                    : recent.map(c => (
                        <span className="history-date-chip" key={c.date}>{c.date}</span>
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

// Import the useRef hook so we can reference the hidden file <input> for JSON import
import { useRef } from 'react';
// Pull in our global habit/mood state and the data-replacement helper from context
import { useHabits } from '../context/HabitContext.jsx';
// Page-specific styles (cards, heatmap grid, mood row, etc.)
import './Insights.css';

// Default export — the Insights page component rendered at the /insights route
export default function Insights() {
  // Destructure the pieces of global state we need on this page
  const { habits, moods, replaceData } = useHabits();
  // A ref pointing at the hidden <input type="file"> so a styled button can trigger it
  const fileInput = useRef(null);

  // Human-readable day labels — index matches JS Date.getDay() (0 = Sunday)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Counter for total check-ins per weekday (used to know which days you log most)
  const dayCounts = Array(7).fill(0);
  // Counter for missed check-ins per weekday (used to find your weakest day)
  const dayMisses = Array(7).fill(0);
  // Walk every habit and every completion to fill those two counters
  habits.forEach(h => h.completions.forEach(c => {
    // Convert the ISO date string into a JS Date and read its weekday number
    const d = new Date(c.date).getDay();
    // If this entry was a miss, bump the miss counter for that weekday
    if (c.status === 'missed') dayMisses[d]++;
    // Always bump the overall counter so we know logging frequency per weekday
    dayCounts[d]++;
  }));

  // Has the user logged at least one missed entry? Avoids fake "Sunday" defaults
  const hasMisses = dayMisses.some(v => v > 0);
  // Index of the weekday with the most misses (only meaningful when hasMisses is true)
  const worstDayIdx = dayMisses.indexOf(Math.max(...dayMisses));
  // Friendly label for the worst day, or a placeholder when we have no data yet
  const worstDay = hasMisses ? dayNames[worstDayIdx] : 'no day';

  // Average current streak across all habits — gives a "typical streak length" metric
  const avgStreak = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.streak, 0) / habits.length)
    : 0;

  // Subset of habits the user scheduled for the morning
  const morningHabits = habits.filter(h => h.time === 'morning');
  // Average completion rate (in %) across those morning habits
  const morningRate = morningHabits.length > 0
    ? Math.round(morningHabits.reduce((s, h) => {
        // How many completions for this habit are marked as done
        const done = h.completions.filter(c => c.status === 'done').length;
        // Convert to a percentage; guard against divide-by-zero
        return s + (h.completions.length > 0 ? (done / h.completions.length) * 100 : 0);
      }, 0) / morningHabits.length)
    : 0;

  // Tally up how often each "miss reason" was used so we can highlight the top one
  const topReason = {};
  // Loop every completion across every habit and bump the matching reason bucket
  habits.forEach(h => h.completions.forEach(c => {
    if (c.reason) topReason[c.reason] = (topReason[c.reason] || 0) + 1;
  }));
  // Pick the reason with the highest count, falling back to "None" when empty
  const mainReason = Object.entries(topReason).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  // The four insight cards rendered at the bottom of the page
  // Each entry holds the icon, the styling tokens, the headline, and a suggestion
  const insights = [
    {
      icon: '📅', bg: 'var(--info-bg)', tag: 'Pattern', tagBg: 'var(--info-bg)', tagColor: 'var(--info)',
      // Headline changes wording when we don't have miss data yet
      title: hasMisses ? `You miss habits most on ${worstDay}s.` : 'No misses logged yet — keep going!',
      body: hasMisses
        ? `Our data shows that ${worstDay} is consistently your most challenging day for habit completion.`
        : 'Once you log a few misses, we will surface your toughest weekday here.',
      suggestion: { icon: '💡', text: `Plan lighter habits for ${worstDay}s`, desc: 'Reduce friction by setting easier goals.' },
    },
    {
      icon: '🔥', bg: 'var(--primary-bg)', tag: 'Streak', tagBg: 'var(--primary-bg)', tagColor: 'var(--primary)',
      title: `Your average current streak is ${avgStreak} days.`,
      body: `Across all your habits, your typical streak length is around ${avgStreak} day${avgStreak === 1 ? '' : 's'}.`,
      suggestion: { icon: '🎯', text: `Set a milestone reward at day ${avgStreak + 3}`, desc: 'Have something to look forward to.' },
    },
    {
      icon: '🌅', bg: 'var(--success-bg)', tag: 'Timing', tagBg: 'var(--success-bg)', tagColor: 'var(--success)',
      title: `Morning completion rate is ${morningRate}%.`,
      body: 'Morning habits tend to have higher completion rates.',
      suggestion: { icon: '⏰', text: 'Move challenging habits to the morning', desc: 'Tackle hard habits when discipline is highest.' },
    },
    {
      icon: '⚠️', bg: 'var(--accent-bg)', tag: 'Reason', tagBg: 'var(--accent-bg)', tagColor: 'var(--accent)',
      title: `"${mainReason}" is your top miss reason.`,
      body: 'Addressing this root cause could improve consistency.',
      suggestion: { icon: '🛡️', text: `Plan for "${mainReason.toLowerCase()}" days`, desc: 'A pre-planned response removes decision fatigue.' },
    },
  ];

  // Total habit count — shown as the first summary card
  const totalHabits = habits.length;
  // Total successful check-ins across every habit — second summary card
  const totalCompletions = habits.reduce(
    (sum, h) => sum + h.completions.filter(c => c.status === 'done').length,
    0,
  );

  // Build the last 7 calendar dates (oldest → newest) used by the mood history strip
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    // Start from today
    const d = new Date();
    // Subtract (6 - i) days so index 0 = 6 days ago, index 6 = today
    d.setDate(d.getDate() - (6 - i));
    // Return just the YYYY-MM-DD portion which matches how moods are keyed
    return d.toISOString().split('T')[0];
  });

  // Export every habit + mood entry as a downloadable JSON file using the Blob API
  const handleExport = () => {
    // Bundle everything we want to back up plus an export timestamp
    const data = { habits, moods, exportedAt: new Date().toISOString() };
    // Convert the JS object into a pretty-printed JSON Blob
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    // Create a temporary object URL pointing to that blob
    const url = URL.createObjectURL(blob);
    // Build a hidden <a> element so we can trigger a download click
    const a = document.createElement('a');
    // Tell it where to point and what filename to suggest
    a.href = url;
    a.download = `consistify-backup-${new Date().toISOString().split('T')[0]}.json`;
    // Trigger the download
    a.click();
    // Clean up the object URL so we don't leak memory
    URL.revokeObjectURL(url);
  };

  // Read a user-selected JSON file and replace the current data with its contents
  const handleImport = (e) => {
    // Grab the first selected file (input[type=file] supports multi but we want one)
    const file = e.target.files?.[0];
    // Guard: bail out if the user cancelled the picker
    if (!file) return;
    // FileReader gives us the file contents as text
    const reader = new FileReader();
    // Runs once the file has been read into memory
    reader.onload = (ev) => {
      try {
        // Try to parse the text as JSON
        const parsed = JSON.parse(ev.target.result);
        // Hand the parsed data to context so habits + moods get swapped in
        replaceData(parsed);
        // Quick visual confirmation for the user
        alert('Data imported successfully!');
      } catch {
        // If parsing fails, the file isn't a valid backup
        alert('Invalid backup file.');
      }
    };
    // Kick off the read — onload above will fire when it finishes
    reader.readAsText(file);
    // Reset the input so picking the same file twice still triggers onChange
    e.target.value = '';
  };

  // Empty state: when the user has no habits there is nothing meaningful to analyze
  if (habits.length === 0) {
    return (
      <div className="insights-page">
        {/* Page title block */}
        <div className="page-header">
          <h1>Insights</h1>
          <p>AI-powered observations to help you build better habits.</p>
        </div>
        {/* Friendly empty illustration that mirrors the Dashboard empty state */}
        <div className="empty-illustration" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div style={{ fontSize: '64px' }}>📊</div>
          <h2>No insights yet</h2>
          <p>Add your first habit and check in for a few days — we'll surface patterns here.</p>
        </div>
      </div>
    );
  }

  // Main render — runs only when at least one habit exists
  return (
    <div className="insights-page">
      {/* Header row: title on the left, export/import buttons on the right */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}
      >
        {/* Title + subtitle */}
        <div>
          <h1>Insights</h1>
          <p>AI-powered observations to help you build better habits.</p>
        </div>
        {/* Action buttons (export downloads JSON, import opens the hidden file picker) */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExport}>⬇️ Export JSON</button>
          <button className="btn btn-outline btn-sm" onClick={() => fileInput.current?.click()}>⬆️ Import JSON</button>
          {/* Hidden input — clicked programmatically by the button above */}
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Top summary row: total habits, total completions, plus one card per habit streak */}
      <div className="insights-summary">
        <div className="summary-card"><div className="summary-value">{totalHabits}</div><div className="summary-label">Total Habits</div></div>
        <div className="summary-card"><div className="summary-value">{totalCompletions}</div><div className="summary-label">Total Completions</div></div>
        {/* One card per habit showing its current streak */}
        {habits.map(h => (
          <div className="summary-card" key={h.id}>
            <div className="summary-value">🔥 {h.streak}</div>
            <div className="summary-label">{h.name}</div>
          </div>
        ))}
      </div>

      {/* Mood history strip — last 7 days of saved mood emojis */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-header">
          <div className="insight-icon" style={{ background: 'var(--accent-bg)' }}>🎭</div>
          <div className="insight-title">Mood — Past 7 Days</div>
        </div>
        <div className="mood-history">
          {/* One cell per date; show the saved emoji or a dot placeholder */}
          {last7Days.map(date => (
            <div className="mood-history-cell" key={date}>
              <div className="mood-history-emoji">{moods[date] || '·'}</div>
              {/* Show MM-DD only — month + day is enough context for 7 days */}
              <div className="mood-history-date">{date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day consistency heatmap — one row per habit, one cell per day */}
      <div className="insight-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-header">
          <div className="insight-icon" style={{ background: 'var(--success-bg)' }}>🗺️</div>
          <div className="insight-title">30-Day Consistency Map</div>
        </div>
        {habits.map(habit => {
          // Build the last 30 calendar dates (oldest → newest) for this habit's row
          const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().split('T')[0];
          });
          return (
            <div className="heatmap-row" key={habit.id}>
              {/* Label: a colored dot + the habit name */}
              <div className="heatmap-label">
                <span className="heatmap-dot" style={{ background: habit.color }} />
                {habit.name}
              </div>
              {/* Grid of 30 cells, one per day */}
              <div className="heatmap-grid">
                {days.map(date => {
                  // Find the completion entry (if any) for this habit on this date
                  const entry = habit.completions.find(c => c.date === date);
                  // Status keyword used both for the color and the tooltip
                  const status = entry?.status || 'none';
                  // Pick a background color based on status
                  const bg = status === 'done'
                    ? habit.color                       // habit accent for successful days
                    : status === 'excused'
                      ? 'var(--info-bg)'                // light blue for streak-freeze days
                      : status === 'missed'
                        ? 'var(--danger-bg)'            // red tint for missed days
                        : 'var(--background)';          // empty days fall back to bg
                  return (
                    <div
                      key={date}
                      className="heatmap-cell"
                      style={{ background: bg }}
                      // Native browser tooltip showing date + status on hover
                      title={`${date} — ${status}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom grid: the four AI-style insight cards built earlier */}
      <div className="insights-grid">
        {insights.map((insight, i) => (
          <div className="insight-card" key={i}>
            {/* Card header: icon, title, and a colored category tag */}
            <div className="insight-header">
              <div className="insight-icon" style={{ background: insight.bg }}>{insight.icon}</div>
              <div style={{ flex: 1 }}><div className="insight-title">{insight.title}</div></div>
              <span className="insight-tag" style={{ background: insight.tagBg, color: insight.tagColor }}>
                {insight.tag}
              </span>
            </div>
            {/* Body explanation under the title */}
            <div className="insight-body">{insight.body}</div>
            {/* Actionable suggestion box at the bottom of each card */}
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

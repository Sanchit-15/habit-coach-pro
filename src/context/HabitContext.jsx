// ===========================================================================
// HabitContext.jsx — The biggest shared "box" in the app.
// It holds:
//   - habits:        the list of habits the user is tracking.
//   - moods:         a map from date -> emoji.
//   - soundEnabled:  whether the "ding" sound plays on completion.
//   - freezes:       weekly streak-freeze allowance.
//   - confettiActive: a flag that triggers the global celebration overlay.
//
// It also exposes many functions: addHabit, checkIn, undoCheckIn, etc.
// All data is persisted to localStorage so it survives page reloads.
// ===========================================================================

// Standard React imports — see other context files for explanations.
// useCallback memoizes a function so its identity stays stable between renders
// (helps avoid re-running effects in children that depend on it).
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the empty context box for habits.
const HabitContext = createContext(null);

// Keys we use in localStorage to save/load each piece of data.
// localStorage stores strings only — we'll JSON.stringify objects.
const STORAGE_KEY = 'consistify_habits';
const MOOD_KEY = 'consistify_moods';
const SOUND_KEY = 'consistify_sound';
const FREEZE_KEY = 'consistify_freezes';

// How many "streak freezes" the user gets per week.
const WEEKLY_FREEZE_LIMIT = 1;

// A few demo habits used the very first time the app runs (no saved data).
// Each habit is a plain JavaScript object with all the fields the UI expects.
const defaultHabits = [
  { id: 1, name: 'Morning Meditation', goal: '10 min', frequency: 'daily', time: 'morning', streak: 12, completions: generateCompletions(12), color: '#E8553A', note: '', reminderTime: '07:00', weeklyGoal: 7, tags: ['mindfulness'], archived: false, order: 0 },
  { id: 2, name: 'Read 20 Pages', goal: '20 pages', frequency: 'daily', time: 'evening', streak: 7, completions: generateCompletions(7), color: '#2F80ED', note: '', reminderTime: '21:00', weeklyGoal: 7, tags: ['learning'], archived: false, order: 1 },
  { id: 3, name: 'Exercise', goal: '30 min', frequency: 'weekdays', time: 'morning', streak: 5, completions: generateCompletions(5), color: '#27AE60', note: '', reminderTime: '06:30', weeklyGoal: 5, tags: ['health'], archived: false, order: 2 },
  { id: 4, name: 'Journal', goal: '1 entry', frequency: 'daily', time: 'evening', streak: 3, completions: generateCompletions(3), color: '#F5A623', note: '', reminderTime: '22:00', weeklyGoal: 7, tags: ['mindfulness'], archived: false, order: 3 },
];

// Returns the YYYY-MM-DD date of the most recent Monday.
// We use this as a "week id" — when it changes, freeze count resets.
function currentWeekStart() {
  const d = new Date();
  // getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
  // We want Monday-based weeks, so treat Sunday (0) as 7.
  const day = d.getDay() === 0 ? 7 : d.getDay();
  // Subtract (day - 1) days to land on Monday.
  d.setDate(d.getDate() - (day - 1));
  // toISOString() = "2026-04-26T...Z". split('T')[0] = "2026-04-26".
  return d.toISOString().split('T')[0];
}

// Take any old or new habit object and ensure it has every field the UI needs.
// This is called "data migration" — keeps the app from crashing if the saved
// data was created by an older version that lacked some fields.
function migrateHabit(habit, index) {
  // Older versions might have stored habits as plain strings (just the name).
  if (typeof habit === 'string') {
    return {
      id: index + 1, name: habit, goal: '', frequency: 'daily', time: 'morning',
      streak: 0, completions: [], completedDates: [], createdAt: new Date().toISOString(),
      // Pick a default color by cycling through 4 options based on position.
      color: ['#E8553A', '#2F80ED', '#27AE60', '#F5A623'][index % 4],
      note: '', reminderTime: '', weeklyGoal: 7, tags: [], archived: false, order: index,
    };
  }
  // Otherwise, spread the existing object and fill in any missing fields.
  // The `??` operator returns the right side only if the left is null/undefined.
  return {
    ...habit,
    completions: habit.completions || [],
    completedDates: habit.completedDates || [],
    createdAt: habit.createdAt || new Date().toISOString(),
    streak: habit.streak || 0,
    note: habit.note || '',
    reminderTime: habit.reminderTime || '',
    weeklyGoal: habit.weeklyGoal ?? 7,
    tags: habit.tags || [],
    archived: habit.archived || false,
    order: habit.order ?? index,
  };
}

// Read habits from localStorage. If anything fails, fall back to defaults.
// Wrapping in try/catch keeps the app alive even if saved data is corrupted.
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY); // string or null
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(migrateHabit);
    }
  } catch (e) { console.warn('Failed to load habits:', e); }
  return defaultHabits;
}

// Same idea for the moods map (date -> emoji).
function loadMoods() {
  try {
    const raw = localStorage.getItem(MOOD_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load moods:', e); }
  return {};
}

// Read the saved "sound effects" preference. Defaults to ON.
function loadSoundEnabled() {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw === 'false') return false;
  } catch {}
  return true;
}

// Read freeze info; if the saved week is the current week, keep it.
// Otherwise reset to a fresh allowance for the new week.
function loadFreezes() {
  try {
    const raw = localStorage.getItem(FREEZE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.weekStart === currentWeekStart()) return parsed;
    }
  } catch {}
  return { weekStart: currentWeekStart(), count: WEEKLY_FREEZE_LIMIT };
}

// Build fake completion history for the demo habits so charts have data.
function generateCompletions(streak) {
  const completions = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (i < streak) {
      // The most recent `streak` days are all "done" so streak counts make sense.
      completions.push({ date: dateStr, status: 'done' });
    } else if (Math.random() > 0.4) {
      completions.push({ date: dateStr, status: 'done' });
    } else {
      // Random "missed" entries with a reason for analytics.
      const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];
      completions.push({ date: dateStr, status: 'missed', reason: reasons[Math.floor(Math.random() * reasons.length)] });
    }
  }
  return completions;
}

// ---------------------------------------------------------------------------
// HabitProvider — the actual Provider component.
// Wrap your app in this so habits/moods/etc. are available everywhere.
// ---------------------------------------------------------------------------
export function HabitProvider({ children }) {
  // useState here is given a FUNCTION (loadHabits) instead of a value.
  // React will call that function once on the first render to compute the
  // initial state. This is called "lazy initialization" — useful when the
  // initial value is expensive to compute (e.g., reads from localStorage).
  const [habits, setHabits] = useState(loadHabits);
  const [moods, setMoods] = useState(loadMoods);
  const [soundEnabled, setSoundEnabled] = useState(loadSoundEnabled);
  const [freezes, setFreezes] = useState(loadFreezes);
  // Boolean flag the GlobalConfetti component watches.
  const [confettiActive, setConfettiActive] = useState(false);
  // The next ID to assign to a new habit. We compute it from the loaded data.
  const [nextId, setNextId] = useState(() => {
    const loaded = loadHabits();
    return loaded.length > 0 ? Math.max(...loaded.map(h => h.id)) + 1 : 1;
  });

  // Save habits to localStorage whenever they change.
  // useEffect with [habits] runs after every render where `habits` changed.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }
    catch (e) { console.warn('Save failed:', e); }
  }, [habits]);

  // Same persistence pattern for moods.
  useEffect(() => {
    try { localStorage.setItem(MOOD_KEY, JSON.stringify(moods)); }
    catch (e) { console.warn('Mood save failed:', e); }
  }, [moods]);

  // Persist the sound toggle.
  useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, String(soundEnabled)); }
    catch (e) { console.warn('Sound save failed:', e); }
  }, [soundEnabled]);

  // Persist the freeze count.
  useEffect(() => {
    try { localStorage.setItem(FREEZE_KEY, JSON.stringify(freezes)); }
    catch (e) { console.warn('Freeze save failed:', e); }
  }, [freezes]);

  // Trigger the confetti overlay for ~2.5 seconds.
  // useCallback memoizes the function so its identity is stable.
  const triggerConfetti = useCallback(() => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2500);
  }, []);

  // Play a tiny "ding" sound. Uses the native browser Audio constructor.
  const playDing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // The src is a tiny base64-encoded WAV file embedded directly in code.
      const a = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YS4AAAAAAAAA/3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//38=');
      a.volume = 0.4;
      // play() returns a Promise. We catch & ignore errors (e.g. autoplay block).
      a.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  // Add a brand new habit to the list.
  const addHabit = (habit) => {
    const colors = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C'];
    // setHabits accepts an "updater" function that receives the previous value.
    // We return a NEW array with the new habit appended (immutability!).
    setHabits(prev => [...prev, {
      ...habit,
      id: nextId,
      streak: 0,
      completions: [],
      color: habit.color || colors[nextId % colors.length],
      note: habit.note || '',
      reminderTime: habit.reminderTime || '',
      weeklyGoal: habit.weeklyGoal ?? 7,
      tags: habit.tags || [],
      archived: false,
      order: prev.length,
      createdAt: new Date().toISOString(),
    }]);
    // Increment the next-id counter so the next added habit gets a fresh id.
    setNextId(prev => prev + 1);
  };

  // Replace some fields on a single habit (looked up by id).
  const updateHabit = (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  // Remove a habit entirely from the list.
  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Mark today's check-in as 'done', 'missed', or 'excused'.
  // If it's a "done", also fire confetti + sound.
  const checkIn = (id, status, reason) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h; // not the habit we're editing — leave alone.
      // Find an existing entry for today so we can replace it (not duplicate).
      const existing = h.completions.findIndex(c => c.date === today);
      const entry = { date: today, status, reason: status === 'missed' ? reason : undefined };
      const completions = existing >= 0
        ? h.completions.map((c, i) => i === existing ? entry : c)
        : [entry, ...h.completions];
      // Update streak: +1 on done, reset to 0 on missed, leave otherwise.
      let streak = h.streak;
      if (status === 'done') streak = h.streak + 1;
      else if (status === 'missed') streak = 0;
      return { ...h, completions, streak };
    }));
    if (status === 'done') {
      triggerConfetti();
      playDing();
    }
  };

  // Convert today's "missed" entry into "excused" so the streak isn't broken.
  // Returns true if a freeze was applied, false if none were available.
  const applyStreakFreeze = (id) => {
    if (freezes.count <= 0) return false;
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const idx = h.completions.findIndex(c => c.date === today);
      if (idx < 0) return h;
      const updated = { date: today, status: 'excused' };
      const completions = h.completions.map((c, i) => i === idx ? updated : c);
      return { ...h, completions };
    }));
    setFreezes(f => ({ ...f, count: f.count - 1 }));
    return true;
  };

  // Reverse today's check-in — used by the Undo toast.
  const undoCheckIn = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const wasDone = h.completions.some(c => c.date === today && c.status === 'done');
      return {
        ...h,
        // Drop today's entry entirely.
        completions: h.completions.filter(c => c.date !== today),
        // If we had incremented the streak, undo that bump.
        streak: wasDone && h.streak > 0 ? h.streak - 1 : h.streak,
      };
    }));
  };

  // Tiny convenience wrappers.
  const archiveHabit = (id) => updateHabit(id, { archived: true });
  const restoreHabit = (id) => updateHabit(id, { archived: false });

  // Save a new order for the visible habits (drag & drop on Dashboard).
  const reorderHabits = (orderedIds) => {
    setHabits(prev => {
      // Build a quick lookup: id -> habit object.
      const map = Object.fromEntries(prev.map(h => [h.id, h]));
      // The reordered ones get a fresh `order` index based on their new position.
      const reordered = orderedIds.map((id, i) => ({ ...map[id], order: i }));
      // Append any habits that weren't part of the reorder list (e.g. archived).
      const others = prev.filter(h => !orderedIds.includes(h.id));
      return [...reordered, ...others];
    });
  };

  // Save today's mood emoji.
  const setTodayMood = (emoji) => {
    const today = new Date().toISOString().split('T')[0];
    setMoods(prev => ({ ...prev, [today]: emoji }));
  };

  // Replace all habits + moods (used by JSON import on Insights page).
  const replaceData = ({ habits: h, moods: m }) => {
    if (Array.isArray(h)) {
      const migrated = h.map(migrateHabit);
      setHabits(migrated);
      setNextId(migrated.length > 0 ? Math.max(...migrated.map(x => x.id)) + 1 : 1);
    }
    if (m && typeof m === 'object') setMoods(m);
  };

  // Toggle the sound preference.
  const toggleSound = () => setSoundEnabled(v => !v);

  // Publish ALL of the above (state + functions) to anyone using useHabits().
  return (
    <HabitContext.Provider value={{
      habits, moods, soundEnabled, freezes, confettiActive,
      addHabit, updateHabit, deleteHabit,
      checkIn, undoCheckIn, applyStreakFreeze,
      archiveHabit, restoreHabit, reorderHabits,
      setTodayMood, replaceData, toggleSound,
      triggerConfetti, playDing,
    }}>
      {children}
    </HabitContext.Provider>
  );
}

// Custom hook so components can do: const { habits, addHabit } = useHabits();
export const useHabits = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
};

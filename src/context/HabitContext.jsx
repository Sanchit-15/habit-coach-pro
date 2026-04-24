import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const HabitContext = createContext(null);

// Storage keys for localStorage persistence
const STORAGE_KEY = 'consistify_habits';
const MOOD_KEY = 'consistify_moods';
const SOUND_KEY = 'consistify_sound';
const FREEZE_KEY = 'consistify_freezes';

// How many freezes a user gets every week (default = 1)
const WEEKLY_FREEZE_LIMIT = 1;

// Default habits used when no saved data exists
const defaultHabits = [
  { id: 1, name: 'Morning Meditation', goal: '10 min', frequency: 'daily', time: 'morning', streak: 12, completions: generateCompletions(12), color: '#E8553A', note: '', reminderTime: '07:00', weeklyGoal: 7, tags: ['mindfulness'], archived: false, order: 0 },
  { id: 2, name: 'Read 20 Pages', goal: '20 pages', frequency: 'daily', time: 'evening', streak: 7, completions: generateCompletions(7), color: '#2F80ED', note: '', reminderTime: '21:00', weeklyGoal: 7, tags: ['learning'], archived: false, order: 1 },
  { id: 3, name: 'Exercise', goal: '30 min', frequency: 'weekdays', time: 'morning', streak: 5, completions: generateCompletions(5), color: '#27AE60', note: '', reminderTime: '06:30', weeklyGoal: 5, tags: ['health'], archived: false, order: 2 },
  { id: 4, name: 'Journal', goal: '1 entry', frequency: 'daily', time: 'evening', streak: 3, completions: generateCompletions(3), color: '#F5A623', note: '', reminderTime: '22:00', weeklyGoal: 7, tags: ['mindfulness'], archived: false, order: 3 },
];

// Returns an ISO date string (YYYY-MM-DD) for the most recent Monday — used to reset weekly freezes
function currentWeekStart() {
  const d = new Date();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return d.toISOString().split('T')[0];
}

/**
 * Safely migrate old habit formats into proper objects with all feature fields.
 */
function migrateHabit(habit, index) {
  if (typeof habit === 'string') {
    return {
      id: index + 1, name: habit, goal: '', frequency: 'daily', time: 'morning',
      streak: 0, completions: [], completedDates: [], createdAt: new Date().toISOString(),
      color: ['#E8553A', '#2F80ED', '#27AE60', '#F5A623'][index % 4],
      note: '', reminderTime: '', weeklyGoal: 7, tags: [], archived: false, order: index,
    };
  }
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

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(migrateHabit);
    }
  } catch (e) { console.warn('Failed to load habits:', e); }
  return defaultHabits;
}

function loadMoods() {
  try {
    const raw = localStorage.getItem(MOOD_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load moods:', e); }
  return {};
}

function loadSoundEnabled() {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw === 'false') return false;
  } catch {}
  return true;
}

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

function generateCompletions(streak) {
  const completions = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (i < streak) {
      completions.push({ date: dateStr, status: 'done' });
    } else if (Math.random() > 0.4) {
      completions.push({ date: dateStr, status: 'done' });
    } else {
      const reasons = ['Busy', 'Forgot', 'Tired', 'Sick', 'Low motivation'];
      completions.push({ date: dateStr, status: 'missed', reason: reasons[Math.floor(Math.random() * reasons.length)] });
    }
  }
  return completions;
}

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState(loadHabits);
  const [moods, setMoods] = useState(loadMoods);
  const [soundEnabled, setSoundEnabled] = useState(loadSoundEnabled);
  const [freezes, setFreezes] = useState(loadFreezes);
  const [confettiActive, setConfettiActive] = useState(false);
  const [nextId, setNextId] = useState(() => {
    const loaded = loadHabits();
    return loaded.length > 0 ? Math.max(...loaded.map(h => h.id)) + 1 : 1;
  });

  // Persist habits whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }
    catch (e) { console.warn('Save failed:', e); }
  }, [habits]);

  // Persist moods whenever they change
  useEffect(() => {
    try { localStorage.setItem(MOOD_KEY, JSON.stringify(moods)); }
    catch (e) { console.warn('Mood save failed:', e); }
  }, [moods]);

  // Persist sound toggle whenever it changes
  useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, String(soundEnabled)); }
    catch (e) { console.warn('Sound save failed:', e); }
  }, [soundEnabled]);

  // Persist freezes whenever they change
  useEffect(() => {
    try { localStorage.setItem(FREEZE_KEY, JSON.stringify(freezes)); }
    catch (e) { console.warn('Freeze save failed:', e); }
  }, [freezes]);

  const triggerConfetti = useCallback(() => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2500);
  }, []);

  const playDing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const a = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YS4AAAAAAAAA/3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//38=');
      a.volume = 0.4;
      a.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  const addHabit = (habit) => {
    const colors = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C'];
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
    setNextId(prev => prev + 1);
  };

  const updateHabit = (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const checkIn = (id, status, reason) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const existing = h.completions.findIndex(c => c.date === today);
      const entry = { date: today, status, reason: status === 'missed' ? reason : undefined };
      const completions = existing >= 0
        ? h.completions.map((c, i) => i === existing ? entry : c)
        : [entry, ...h.completions];
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

  const useStreakFreeze = (id) => {
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

  const undoCheckIn = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const wasDone = h.completions.some(c => c.date === today && c.status === 'done');
      return {
        ...h,
        completions: h.completions.filter(c => c.date !== today),
        streak: wasDone && h.streak > 0 ? h.streak - 1 : h.streak,
      };
    }));
  };

  const archiveHabit = (id) => updateHabit(id, { archived: true });
  const restoreHabit = (id) => updateHabit(id, { archived: false });

  const reorderHabits = (orderedIds) => {
    setHabits(prev => {
      const map = Object.fromEntries(prev.map(h => [h.id, h]));
      const reordered = orderedIds.map((id, i) => ({ ...map[id], order: i }));
      const others = prev.filter(h => !orderedIds.includes(h.id));
      return [...reordered, ...others];
    });
  };

  const setTodayMood = (emoji) => {
    const today = new Date().toISOString().split('T')[0];
    setMoods(prev => ({ ...prev, [today]: emoji }));
  };

  const replaceData = ({ habits: h, moods: m }) => {
    if (Array.isArray(h)) {
      const migrated = h.map(migrateHabit);
      setHabits(migrated);
      setNextId(migrated.length > 0 ? Math.max(...migrated.map(x => x.id)) + 1 : 1);
    }
    if (m && typeof m === 'object') setMoods(m);
  };

  const toggleSound = () => setSoundEnabled(v => !v);

  return (
    <HabitContext.Provider value={{
      habits, moods, soundEnabled, freezes, confettiActive,
      addHabit, updateHabit, deleteHabit,
      checkIn, undoCheckIn, useStreakFreeze,
      archiveHabit, restoreHabit, reorderHabits,
      setTodayMood, replaceData, toggleSound,
      triggerConfetti, playDing,
    }}>
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
};

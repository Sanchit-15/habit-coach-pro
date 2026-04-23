import { createContext, useContext, useState, useEffect, useRef } from 'react';

const HabitContext = createContext(null);

// Storage keys for localStorage persistence
const STORAGE_KEY = 'consistify_habits';
const MOOD_KEY = 'consistify_moods';

// Default habits used when no saved data exists
const defaultHabits = [
  { id: 1, name: 'Morning Meditation', goal: '10 min', frequency: 'daily', customDays: [], time: 'morning', category: 'Mindfulness', priority: 'high', streak: 12, completions: generateCompletions(12), color: '#E8553A' },
  { id: 2, name: 'Read 20 Pages', goal: '20 pages', frequency: 'daily', customDays: [], time: 'evening', category: 'Study', priority: 'medium', streak: 7, completions: generateCompletions(7), color: '#2F80ED' },
  { id: 3, name: 'Exercise', goal: '30 min', frequency: 'weekdays', customDays: [], time: 'morning', category: 'Fitness', priority: 'high', streak: 5, completions: generateCompletions(5), color: '#27AE60' },
  { id: 4, name: 'Journal', goal: '1 entry', frequency: 'daily', customDays: [], time: 'evening', category: 'Personal', priority: 'low', streak: 3, completions: generateCompletions(3), color: '#F5A623' },
];

// Available categories and priorities (used by forms and filters)
export const CATEGORIES = ['Health', 'Study', 'Fitness', 'Mindfulness', 'Personal', 'Productivity'];
export const PRIORITIES = ['high', 'medium', 'low'];
export const CATEGORY_COLORS = {
  Health: '#27AE60',
  Study: '#2F80ED',
  Fitness: '#E8553A',
  Mindfulness: '#9B59B6',
  Personal: '#F5A623',
  Productivity: '#1ABC9C',
};
export const PRIORITY_COLORS = {
  high: '#EB5757',
  medium: '#F5A623',
  low: '#27AE60',
};

/**
 * Safely migrate old habit formats into the latest object shape.
 * Adds defaults for new fields: notes, reminderTime, archived, order, weeklyGoal, tags.
 */
function migrateHabit(habit, index) {
  // Convert legacy plain-string habits to objects
  if (typeof habit === 'string') {
    return {
      id: index + 1,
      name: habit,
      goal: '',
      frequency: 'daily',
      time: 'morning',
      streak: 0,
      completions: [],
      completedDates: [],
      createdAt: new Date().toISOString(),
      color: ['#E8553A', '#2F80ED', '#27AE60', '#F5A623'][index % 4],
      notes: '',
      reminderTime: '',
      archived: false,
      order: index,
      weeklyGoal: 7,
      tags: [],
    };
  }
  return {
    ...habit,
    completions: habit.completions || [],
    completedDates: habit.completedDates || [],
    createdAt: habit.createdAt || new Date().toISOString(),
    streak: habit.streak || 0,
    category: habit.category || 'Personal',
    priority: habit.priority || 'medium',
    customDays: habit.customDays || [],
    // New fields with safe defaults so existing data keeps working
    notes: habit.notes || '',
    reminderTime: habit.reminderTime || '',
    archived: habit.archived || false,
    order: typeof habit.order === 'number' ? habit.order : index,
    weeklyGoal: habit.weeklyGoal || 7,
    tags: habit.tags || [],
  };
}

/** Load habits from localStorage with safe migration. */
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(migrateHabit);
    }
  } catch (e) {
    console.warn('Failed to load habits from localStorage:', e);
  }
  return defaultHabits.map((h, i) => migrateHabit(h, i));
}

/** Load mood history from localStorage. Shape: { 'YYYY-MM-DD': emoji }. */
function loadMoods() {
  try {
    const raw = localStorage.getItem(MOOD_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {};
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
  // Stash for the most recent check-in so an "Undo" toast can revert it
  const lastCheckInRef = useRef(null);

  const [nextId, setNextId] = useState(() => {
    const loaded = loadHabits();
    return loaded.length > 0 ? Math.max(...loaded.map(h => h.id)) + 1 : 1;
  });

  // Persist habits whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }
    catch (e) { console.warn('Failed to save habits:', e); }
  }, [habits]);

  // Persist mood log whenever it changes
  useEffect(() => {
    try { localStorage.setItem(MOOD_KEY, JSON.stringify(moods)); }
    catch (e) { console.warn('Failed to save moods:', e); }
  }, [moods]);

  const addHabit = (habit) => {
    const colors = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C'];
    setHabits(prev => [
      ...prev,
      {
        ...habit,
        id: nextId,
        streak: 0,
        completions: [],
        // Use user-picked color if provided, otherwise rotate through palette
        color: habit.color || colors[nextId % colors.length],
        archived: false,
        order: prev.length,
        notes: habit.notes || '',
        reminderTime: habit.reminderTime || '',
        weeklyGoal: habit.weeklyGoal || 7,
        tags: habit.tags || [],
      },
    ]);
    setNextId(prev => prev + 1);
  };

  const updateHabit = (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Toggle archive flag for a habit (used by archive / restore buttons)
  const archiveHabit = (id, archived = true) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived } : h));
  };

  // Persist a new habit order (used after drag-and-drop reorder)
  const reorderHabits = (orderedIds) => {
    setHabits(prev => {
      const map = new Map(prev.map(h => [h.id, h]));
      const reordered = orderedIds.map((id, idx) => ({ ...map.get(id), order: idx }));
      // Append any habits that weren't in the ordered list (e.g. archived)
      const missing = prev.filter(h => !orderedIds.includes(h.id));
      return [...reordered, ...missing];
    });
  };

  const checkIn = (id, status, reason) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => {
      const habit = prev.find(h => h.id === id);
      if (habit) {
        // Save snapshot so we can undo this exact check-in later
        lastCheckInRef.current = {
          id,
          date: today,
          previousCompletions: habit.completions,
          previousStreak: habit.streak,
        };
      }
      return prev.map(h => {
        if (h.id !== id) return h;
        const existing = h.completions.findIndex(c => c.date === today);
        const entry = { date: today, status, reason: status === 'missed' ? reason : undefined };
        const completions = existing >= 0
          ? h.completions.map((c, i) => i === existing ? entry : c)
          : [entry, ...h.completions];
        const streak = status === 'done' ? h.streak + 1 : 0;
        return { ...h, completions, streak };
      });
    });
  };

  // Revert the most recent check-in back to its prior state
  const undoLastCheckIn = () => {
    const last = lastCheckInRef.current;
    if (!last) return false;
    setHabits(prev => prev.map(h => h.id === last.id
      ? { ...h, completions: last.previousCompletions, streak: last.previousStreak }
      : h));
    lastCheckInRef.current = null;
    return true;
  };

  // Save today's mood (one entry per day, overwrites if user changes it)
  const setTodayMood = (emoji) => {
    const today = new Date().toISOString().split('T')[0];
    setMoods(prev => ({ ...prev, [today]: emoji }));
  };

  // Replace all habits + moods (used by the JSON Import feature)
  const importData = (data) => {
    if (data && Array.isArray(data.habits)) {
      const migrated = data.habits.map(migrateHabit);
      setHabits(migrated);
      setNextId(migrated.length > 0 ? Math.max(...migrated.map(h => h.id)) + 1 : 1);
    }
    if (data && data.moods && typeof data.moods === 'object') {
      setMoods(data.moods);
    }
  };

  return (
    <HabitContext.Provider value={{
      habits, moods,
      addHabit, updateHabit, deleteHabit, archiveHabit, reorderHabits,
      checkIn, undoLastCheckIn, setTodayMood, importData,
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

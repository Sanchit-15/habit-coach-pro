import { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext(null);

// Storage key for localStorage persistence
const STORAGE_KEY = 'consistify_habits';

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
 * Safely migrate old habit formats (e.g. plain strings) into proper objects.
 * Ensures every habit has: id, name, createdAt, completedDates, completions, streak, color.
 */
function migrateHabit(habit, index) {
  // If habit was stored as a plain string, convert to object
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
    };
  }
  // Ensure required fields exist on existing objects
  return {
    ...habit,
    completions: habit.completions || [],
    completedDates: habit.completedDates || [],
    createdAt: habit.createdAt || new Date().toISOString(),
    streak: habit.streak || 0,
    // New fields with safe defaults so old data keeps working
    category: habit.category || 'Personal',
    priority: habit.priority || 'medium',
    customDays: habit.customDays || [],
  };
}

/**
 * Load habits from localStorage with safe migration.
 * Falls back to default habits if nothing is saved.
 */
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(migrateHabit);
      }
    }
  } catch (e) {
    console.warn('Failed to load habits from localStorage:', e);
  }
  return defaultHabits;
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
  const [nextId, setNextId] = useState(() => {
    const loaded = loadHabits();
    return loaded.length > 0 ? Math.max(...loaded.map(h => h.id)) + 1 : 1;
  });

  // Persist habits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.warn('Failed to save habits to localStorage:', e);
    }
  }, [habits]);

  const addHabit = (habit) => {
    const colors = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C'];
    setHabits(prev => [...prev, { ...habit, id: nextId, streak: 0, completions: [], color: colors[nextId % colors.length] }]);
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
      const streak = status === 'done' ? h.streak + 1 : 0;
      return { ...h, completions, streak };
    }));
  };

  return (
    <HabitContext.Provider value={{ habits, addHabit, updateHabit, deleteHabit, checkIn }}>
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
};

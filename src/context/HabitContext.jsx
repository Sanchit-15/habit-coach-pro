import { createContext, useContext, useState } from 'react';

const HabitContext = createContext(null);

const initialHabits = [
  { id: 1, name: 'Morning Meditation', goal: '10 min', frequency: 'daily', time: 'morning', streak: 12, completions: generateCompletions(12), color: '#E8553A' },
  { id: 2, name: 'Read 20 Pages', goal: '20 pages', frequency: 'daily', time: 'evening', streak: 7, completions: generateCompletions(7), color: '#2F80ED' },
  { id: 3, name: 'Exercise', goal: '30 min', frequency: 'weekdays', time: 'morning', streak: 5, completions: generateCompletions(5), color: '#27AE60' },
  { id: 4, name: 'Journal', goal: '1 entry', frequency: 'daily', time: 'evening', streak: 3, completions: generateCompletions(3), color: '#F5A623' },
];

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
  const [habits, setHabits] = useState(initialHabits);
  const [nextId, setNextId] = useState(5);

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

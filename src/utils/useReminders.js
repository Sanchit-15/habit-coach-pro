import { useEffect, useRef } from 'react';

// Schedule a browser notification at each habit's reminderTime (HH:MM).
// Re-runs daily and only fires if the user has granted Notification permission.
export function useReminders(habits) {
  const timers = useRef([]);

  useEffect(() => {
    // Ask for permission once when reminders are present
    if ('Notification' in window && Notification.permission === 'default') {
      const hasReminder = habits.some(h => h.reminderTime && !h.archived);
      if (hasReminder) Notification.requestPermission().catch(() => {});
    }

    // Clear any existing timers from a previous render
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    habits.forEach(h => {
      if (!h.reminderTime || h.archived) return;
      const [hh, mm] = h.reminderTime.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) return;
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      // If the time already passed today, schedule for tomorrow
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();
      // setTimeout max is ~24.8 days; we're safely under that
      const t = setTimeout(() => {
        try {
          new Notification('CONSISTIFY reminder', {
            body: `Time to: ${h.name}`,
            icon: '/favicon.ico',
          });
        } catch {}
      }, delay);
      timers.current.push(t);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [habits]);
}

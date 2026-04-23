import { useEffect, useRef } from 'react';

/**
 * Schedules one Notification per habit that has a reminderTime ("HH:MM").
 * Fires once per day at the chosen time, while the tab is open.
 */
export default function useReminders(habits) {
  // Track active timers so we can clear them when habits change
  const timersRef = useRef([]);

  useEffect(() => {
    // Skip entirely if browser doesn't support Notifications
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Clear previously-scheduled timers before re-scheduling
    timersRef.current.forEach(id => clearTimeout(id));
    timersRef.current = [];

    // Need permission to actually display reminders — silently exit if not granted
    if (Notification.permission !== 'granted') return;

    const now = new Date();

    habits.forEach(habit => {
      if (!habit.reminderTime || habit.archived) return;
      const [hh, mm] = habit.reminderTime.split(':').map(Number);
      if (isNaN(hh) || isNaN(mm)) return;

      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      // If today's slot already passed, schedule for tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const delay = target.getTime() - now.getTime();

      const id = setTimeout(() => {
        try {
          new Notification(`⏰ Habit reminder: ${habit.name}`, {
            body: habit.goal ? `Goal: ${habit.goal}` : 'Time to check in on this habit.',
            tag: `habit-${habit.id}`,
          });
        } catch (e) { /* notification API may throw in some contexts */ }
      }, delay);

      timersRef.current.push(id);
    });

    return () => {
      timersRef.current.forEach(id => clearTimeout(id));
    };
  }, [habits]);
}

/** Helper to ask the user for notification permission on demand. */
export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('unsupported');
  }
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  return Notification.requestPermission();
}

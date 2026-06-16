// ===========================================================================
// HabitContext.jsx — Global "box" for habits, completions and moods.
//
// UPDATED:
// - Added archivedHabits state
// - refresh() now fetches /api/habits/archived
// - Archive page can now access archived habits correctly
// ===========================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Auth context tells us whether a user is logged in.
import { useAuth } from './AuthContext.jsx';
// Small wrapper around fetch() that automatically sends the JWT token.
import { apiFetch } from '../utils/api.js';

// Create the global context object.
const HabitContext = createContext(null);

// Weekly freeze limit — user can excuse one missed habit per week.
const WEEKLY_FREEZE_LIMIT = 1;

// ---------------------------------------------------------------------------
// Helper: get Monday's date for the current week.
// Used so streak-freeze resets every week.
// ---------------------------------------------------------------------------
function currentWeekStart() {
  const d = new Date();

  // JS: Sunday = 0, Monday = 1 ... Saturday = 6
  // Convert Sunday into 7 so Monday becomes the first day.
  const day = d.getDay() === 0 ? 7 : d.getDay();

  // Move backward until we hit Monday.
  d.setDate(d.getDate() - (day - 1));

  // Return YYYY-MM-DD only.
  return d.toISOString().split('T')[0];
}

// Today's date in YYYY-MM-DD format.
const todayKey = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Calculate a habit streak from completion history.
//
// done     → streak +1
// excused  → keep streak alive
// missed   → streak breaks
// ---------------------------------------------------------------------------
function computeStreak(completions) {
  // No completions → streak is zero.
  if (!completions || completions.length === 0) {
    return 0;
  }

  // Quick lookup map:
  // {
  //   "2026-04-26": "done",
  //   "2026-04-25": "missed"
  // }
  const byDate = {};

  for (const c of completions) {
    byDate[c.dateKey || c.date] = c.status;
  }

  let streak = 0;

  // Start checking from today backward.
  const cursor = new Date();

  // Safety cap: max 365 days.
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().split('T')[0];

    const status = byDate[key];

    if (status === 'done') {
      // Successful day → streak grows.
      streak += 1;
    } else if (status === 'excused') {
      // Freeze day → streak survives but doesn't increase.
    } else if (status === 'missed') {
      // Missed day → streak ends.
      break;
    } else if (i === 0) {
      // No entry for today yet → allow streak to continue backward.
    } else {
      // Missing past entry → stop streak.
      break;
    }

    // Move one day backward.
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Merge habits + completions into the exact structure the frontend expects.
//
// MongoDB:
// habits collection
// completions collection
//
// UI expects:
// [
//   {
//     id,
//     name,
//     completions: [],
//     streak
//   }
// ]
// ---------------------------------------------------------------------------
function attachCompletions(rawHabits, rawCompletions) {
  // Group completions by habit ID.
  const grouped = {};

  for (const c of rawCompletions) {
    const hid = String(c.habitId);

    if (!grouped[hid]) {
      grouped[hid] = [];
    }

    grouped[hid].push({
      // Keep both names for frontend compatibility.
      date: c.dateKey,
      dateKey: c.dateKey,

      status: c.status || 'done',

      reason: c.reason || undefined,
    });
  }

  // Merge each habit with its completions.
  return rawHabits.map((h) => {
    const completions = grouped[String(h._id)] || [];

    return {
      // Frontend uses `id`
      id: h._id,

      // Keep original Mongo _id too.
      _id: h._id,

      name: h.name,

      goal: h.goal || '',

      frequency: h.frequency || 'daily',

      time: h.time || 'morning',

      color: h.color || '#2F80ED',

      note: h.note || '',

      // Backend stores dueTime.
      reminderTime: h.dueTime || '',
      dueTime: h.dueTime || '',

      tags: h.tags || [],

      weeklyGoal: h.weeklyGoal ?? 7,

      order: h.order ?? 0,

      archived: !!h.archived,

      createdAt: h.createdAt,

      completions,

      // Calculate live streak.
      streak: computeStreak(completions),
    };
  });
}

// ---------------------------------------------------------------------------
// Convert mood documents into:
//
// {
//   "2026-04-26": "😀"
// }
// ---------------------------------------------------------------------------
function moodsToMap(rawMoods) {
  const out = {};

  for (const m of rawMoods) {
    out[m.dateKey] = m.mood;
  }

  return out;
}

// ===========================================================================
// HabitProvider
// ===========================================================================
export function HabitProvider({ children }) {
  // Current logged-in user.
  const { user } = useAuth();

  // -------------------------------------------------------------------------
  // GLOBAL STATE
  // -------------------------------------------------------------------------

  // Active habits only.
  const [habits, setHabits] = useState([]);

  // NEW:
  // Archived habits stored separately.
  const [archivedHabits, setArchivedHabits] = useState([]);

  // Mood map.
  const [moods, setMoods] = useState({});

  // Sound toggle.
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Weekly streak-freeze state.
  const [freezes, setFreezes] = useState({
    weekStart: currentWeekStart(),
    count: WEEKLY_FREEZE_LIMIT,
  });

  // Confetti animation state.
  const [confettiActive, setConfettiActive] = useState(false);

  // -------------------------------------------------------------------------
  // Load ALL data from backend.
  // Called after login + after every mutation.
  // -------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    // No logged-in user → clear all state.
    if (!user) {
      setHabits([]);
      setArchivedHabits([]);
      setMoods({});
      return;
    }

    try {
      // Fetch everything in parallel.
      const [
        rawHabits,
        rawArchivedHabits,
        rawCompletions,
        rawMoods,
      ] = await Promise.all([
        // Active habits only.
        apiFetch('/api/habits'),

        // Archived habits only.
        apiFetch('/api/habits/archived'),

        // All completions.
        apiFetch('/api/completions'),

        // All moods.
        apiFetch('/api/moods'),
      ]);

      // Attach completions to active habits.
      setHabits(
        attachCompletions(rawHabits || [], rawCompletions || [])
      );

      // Attach completions to archived habits too.
      setArchivedHabits(
        attachCompletions(rawArchivedHabits || [], rawCompletions || [])
      );

      // Convert moods into map.
      setMoods(moodsToMap(rawMoods || []));
    } catch (err) {
      console.warn('Failed to load data from backend:', err.message);
    }
  }, [user]);

  // Reload data whenever user changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------------------------------------------------------------
  // Trigger confetti overlay for 2.5 seconds.
  // -------------------------------------------------------------------------
  const triggerConfetti = useCallback(() => {
    setConfettiActive(true);

    setTimeout(() => {
      setConfettiActive(false);
    }, 2500);
  }, []);

  // -------------------------------------------------------------------------
  // Tiny sound effect when habit is completed.
  // -------------------------------------------------------------------------
  const playDing = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const a = new Audio(
        'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YS4AAAAAAAAA/3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//38='
      );

      a.volume = 0.4;

      a.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  // -------------------------------------------------------------------------
  // CREATE HABIT
  // -------------------------------------------------------------------------
  const addHabit = async (habit) => {
    try {
      await apiFetch('/api/habits', {
        method: 'POST',
        body: habit,
      });

      await refresh();
    } catch (err) {
      alert(`Could not add habit: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // UPDATE HABIT
  // -------------------------------------------------------------------------
  const updateHabit = async (id, updates) => {
    try {
      await apiFetch(`/api/habits/${id}`, {
        method: 'PUT',
        body: updates,
      });

      await refresh();
    } catch (err) {
      alert(`Could not update habit: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // DELETE HABIT
  // -------------------------------------------------------------------------
  const deleteHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      await refresh();
    } catch (err) {
      alert(`Could not delete habit: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // CHECK-IN
  // -------------------------------------------------------------------------
  const checkIn = async (id, status, reason) => {
    try {
      await apiFetch('/api/completions', {
        method: 'POST',
        body: {
          habitId: id,
          status,
          reason,
        },
      });

      await refresh();

      if (status === 'done') {
        triggerConfetti();
        playDing();
      }
    } catch (err) {
      alert(`Could not save check-in: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // UNDO TODAY'S CHECK-IN
  // -------------------------------------------------------------------------
  const undoCheckIn = async (id) => {
    try {
      await apiFetch(`/api/completions/${id}/today`, {
        method: 'DELETE',
      });

      await refresh();
    } catch (err) {
      console.warn('Undo failed:', err.message);
    }
  };

  // -------------------------------------------------------------------------
  // APPLY STREAK FREEZE
  // -------------------------------------------------------------------------
  const applyStreakFreeze = async (id) => {
    if (freezes.count <= 0) {
      return false;
    }

    try {
      await apiFetch('/api/completions', {
        method: 'POST',
        body: {
          habitId: id,
          status: 'excused',
        },
      });

      setFreezes((f) => ({
        ...f,
        count: f.count - 1,
      }));

      await refresh();

      return true;
    } catch (err) {
      alert(`Could not apply freeze: ${err.message}`);
      return false;
    }
  };

  // -------------------------------------------------------------------------
  // ARCHIVE HABIT
  // -------------------------------------------------------------------------
  const archiveHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}/archive`, {
        method: 'PATCH',
      });

      await refresh();
    } catch (err) {
      alert(`Could not archive: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // RESTORE HABIT
  // -------------------------------------------------------------------------
  const restoreHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}/restore`, {
        method: 'PATCH',
      });

      await refresh();
    } catch (err) {
      alert(`Could not restore: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // REORDER HABITS
  // -------------------------------------------------------------------------
  const reorderHabits = async (orderedIds) => {
    try {
      await apiFetch('/api/habits/reorder', {
        method: 'PATCH',
        body: {
          orderedIds,
        },
      });

      await refresh();
    } catch (err) {
      alert(`Could not reorder: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // SAVE TODAY'S MOOD
  // -------------------------------------------------------------------------
  const setTodayMood = async (emoji) => {
    const key = todayKey();

    // Optimistic update.
    setMoods((prev) => ({
      ...prev,
      [key]: emoji,
    }));

    try {
      await apiFetch('/api/moods', {
        method: 'POST',
        body: {
          mood: emoji,
        },
      });
    } catch (err) {
      alert(`Could not save mood: ${err.message}`);

      // Reload actual backend data.
      await refresh();
    }
  };

  // -------------------------------------------------------------------------
  // IMPORT JSON PLACEHOLDER
  // -------------------------------------------------------------------------
  const replaceData = async () => {
    alert('Bulk import is not available with backend storage yet.');
  };

  // -------------------------------------------------------------------------
  // SOUND TOGGLE
  // -------------------------------------------------------------------------
  const toggleSound = () => {
    setSoundEnabled((v) => !v);
  };

  // -------------------------------------------------------------------------
  // Expose all state + functions to the app.
  // -------------------------------------------------------------------------
  return (
    <HabitContext.Provider
      value={{
        habits,

        // NEW
        archivedHabits,

        moods,

        soundEnabled,

        freezes,

        confettiActive,

        addHabit,
        updateHabit,
        deleteHabit,

        checkIn,
        undoCheckIn,
        applyStreakFreeze,

        archiveHabit,
        restoreHabit,
        reorderHabits,

        setTodayMood,
        replaceData,

        toggleSound,

        triggerConfetti,
        playDing,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

// ===========================================================================
// Custom hook:
//
// const { habits, addHabit } = useHabits();
// ===========================================================================
export const useHabits = () => {
  const ctx = useContext(HabitContext);

  if (!ctx) {
    throw new Error('useHabits must be used within HabitProvider');
  }

  return ctx;
};
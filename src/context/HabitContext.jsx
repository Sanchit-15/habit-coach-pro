// ===========================================================================
// HabitContext.jsx — Global "box" for habits, completions and moods.
//
// 🆕 Phase 2 change: ALL data now comes from the MongoDB backend through
//    /src/utils/api.js. Nothing about habits/moods/completions touches
//    localStorage anymore — only the JWT token does (in src/utils/auth.js).
//
// The PUBLIC SHAPE of this context is intentionally unchanged so the UI
// (Dashboard, MyHabits, Insights, Archive, etc.) keeps working without edits.
//   habits          → array of habit objects, each with .completions + .streak
//   moods           → { "YYYY-MM-DD": "😀" } map (computed from API rows)
//   soundEnabled    → boolean (in-memory; per spec only JWT lives in storage)
//   freezes         → { weekStart, count } weekly freeze allowance (in-memory)
//   confettiActive  → boolean flag the GlobalConfetti overlay watches
//   addHabit / updateHabit / deleteHabit / checkIn / undoCheckIn /
//   applyStreakFreeze / archiveHabit / restoreHabit / reorderHabits /
//   setTodayMood / replaceData / toggleSound / triggerConfetti / playDing
// ===========================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// useAuth tells us when a user is logged in so we know when to (re)load data.
import { useAuth } from './AuthContext.jsx';
// Our tiny fetch wrapper that adds the JWT header automatically.
import { apiFetch } from '../utils/api.js';

// Create the empty context box.
const HabitContext = createContext(null);

// Weekly streak-freeze allowance (kept in memory; resets on app reload/week).
const WEEKLY_FREEZE_LIMIT = 1;

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

// Returns the YYYY-MM-DD date of the most recent Monday — used as a "week id".
function currentWeekStart() {
  const d = new Date();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return d.toISOString().split('T')[0];
}

// Today's date as "YYYY-MM-DD" — used everywhere we talk about "today".
const todayKey = () => new Date().toISOString().split('T')[0];

// Compute a habit's current streak from its completion list.
// Walks backwards day-by-day from today; stops on the first 'missed' day.
// 'excused' (a freeze) keeps the streak alive without incrementing.
function computeStreak(completions) {
  if (!completions || completions.length === 0) return 0;
  // Build a quick lookup: dateKey -> status.
  const byDate = {};
  for (const c of completions) byDate[c.dateKey || c.date] = c.status;
  let streak = 0;
  const cursor = new Date();
  // Safety cap so we never loop forever.
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().split('T')[0];
    const status = byDate[key];
    if (status === 'done') streak += 1;
    else if (status === 'excused') {
      // Freeze day — don't break, don't add to count.
    } else if (status === 'missed') break;
    else if (i === 0) {
      // No entry for today yet — that's fine, just keep walking back.
    } else {
      // No entry for a past day either → streak stops here.
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Merge raw habits from the API with their completions so each habit object
// looks like the OLD shape the UI expects: { ...habit, completions, streak }.
function attachCompletions(rawHabits, rawCompletions) {
  // Group completions by habitId for fast lookup.
  const grouped = {};
  for (const c of rawCompletions) {
    const hid = String(c.habitId);
    if (!grouped[hid]) grouped[hid] = [];
    // Keep BOTH `date` (legacy field name) and `dateKey` (API field) so the
    // UI keeps working whether it reads .date or .dateKey.
    grouped[hid].push({
      date: c.dateKey,
      dateKey: c.dateKey,
      status: c.status || 'done',
      reason: c.reason || undefined,
    });
  }
  return rawHabits.map((h) => {
    const completions = grouped[String(h._id)] || [];
    return {
      // The UI uses `id` — map Mongo's _id to id while keeping _id around too.
      id: h._id,
      _id: h._id,
      name: h.name,
      goal: h.goal || '',
      frequency: h.frequency || 'daily',
      time: h.time || 'morning',
      color: h.color || '#2F80ED',
      note: h.note || '',
      reminderTime: h.dueTime || '',
      dueTime: h.dueTime || '',
      tags: h.tags || [],
      weeklyGoal: h.weeklyGoal ?? 7,
      order: h.order ?? 0,
      archived: !!h.archived,
      createdAt: h.createdAt,
      completions,
      streak: computeStreak(completions),
    };
  });
}

// Convert API mood rows into the legacy { date: emoji } map shape.
function moodsToMap(rawMoods) {
  const out = {};
  for (const m of rawMoods) out[m.dateKey] = m.mood;
  return out;
}

// ---------------------------------------------------------------------------
// HabitProvider
// ---------------------------------------------------------------------------
export function HabitProvider({ children }) {
  // We need to know whether someone is logged in before we hit the API.
  const { user } = useAuth();

  // Public state — same names as before.
  const [habits, setHabits] = useState([]);
  const [moods, setMoods] = useState({});
  // Sound + freezes are runtime-only now (no localStorage per spec).
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [freezes, setFreezes] = useState({
    weekStart: currentWeekStart(),
    count: WEEKLY_FREEZE_LIMIT,
  });
  const [confettiActive, setConfettiActive] = useState(false);

  // Load everything from the backend. Called on login + after mutations.
  const refresh = useCallback(async () => {
    if (!user) {
      // Logged out → wipe local copies so the next user starts clean.
      setHabits([]);
      setMoods({});
      return;
    }
    try {
      // Fire all three GETs in parallel for speed.
      const [rawHabits, rawCompletions, rawMoods] = await Promise.all([
        apiFetch('/api/habits'),
        apiFetch('/api/completions'),
        apiFetch('/api/moods'),
      ]);
      setHabits(attachCompletions(rawHabits || [], rawCompletions || []));
      setMoods(moodsToMap(rawMoods || []));
    } catch (err) {
      // Friendly console message; UI keeps showing whatever it had.
      console.warn('Failed to load data from backend:', err.message);
    }
  }, [user]);

  // Whenever the logged-in user changes, reload data.
  useEffect(() => { refresh(); }, [refresh]);

  // Trigger the confetti overlay for ~2.5 seconds. (Visual only.)
  const triggerConfetti = useCallback(() => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2500);
  }, []);

  // Tiny "ding" sound effect.
  const playDing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const a = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YS4AAAAAAAAA/3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//38=');
      a.volume = 0.4;
      a.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  // -----------------------------------------------------------------------
  // Mutations — each one calls the API then refreshes (or updates locally).
  // -----------------------------------------------------------------------

  // Create a habit on the server, then reload the list.
  const addHabit = async (habit) => {
    try {
      await apiFetch('/api/habits', { method: 'POST', body: habit });
      await refresh();
    } catch (err) {
      alert(`Could not add habit: ${err.message}`);
    }
  };

  // Patch a habit's fields.
  const updateHabit = async (id, updates) => {
    try {
      await apiFetch(`/api/habits/${id}`, { method: 'PUT', body: updates });
      await refresh();
    } catch (err) {
      alert(`Could not update habit: ${err.message}`);
    }
  };

  // Hard-delete a habit (and its completions, server-side).
  const deleteHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      alert(`Could not delete habit: ${err.message}`);
    }
  };

  // Mark today as done / missed / excused for one habit.
  const checkIn = async (id, status, reason) => {
    try {
      await apiFetch('/api/completions', {
        method: 'POST',
        body: { habitId: id, status, reason },
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

  // Undo today's check-in (used by the Undo toast).
  const undoCheckIn = async (id) => {
    try {
      await apiFetch(`/api/completions/${id}/today`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      // Silent: undoing something that no longer exists is fine.
      console.warn('Undo failed:', err.message);
    }
  };

  // Convert today's "missed" into "excused" — costs one freeze.
  const applyStreakFreeze = async (id) => {
    if (freezes.count <= 0) return false;
    try {
      await apiFetch('/api/completions', {
        method: 'POST',
        body: { habitId: id, status: 'excused' },
      });
      setFreezes((f) => ({ ...f, count: f.count - 1 }));
      await refresh();
      return true;
    } catch (err) {
      alert(`Could not apply freeze: ${err.message}`);
      return false;
    }
  };

  // Soft-delete / restore.
  const archiveHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}/archive`, { method: 'PATCH' });
      await refresh();
    } catch (err) {
      alert(`Could not archive: ${err.message}`);
    }
  };
  const restoreHabit = async (id) => {
    try {
      await apiFetch(`/api/habits/${id}/restore`, { method: 'PATCH' });
      await refresh();
    } catch (err) {
      alert(`Could not restore: ${err.message}`);
    }
  };

  // Drag-and-drop reordering — send the new id order to the server.
  const reorderHabits = async (orderedIds) => {
    try {
      await apiFetch('/api/habits/reorder', {
        method: 'PATCH',
        body: { orderedIds },
      });
      await refresh();
    } catch (err) {
      alert(`Could not reorder: ${err.message}`);
    }
  };

  // Save (or replace) today's mood emoji.
  const setTodayMood = async (emoji) => {
    const key = todayKey();
    // Optimistic UI update so the emoji shows up immediately.
    setMoods((prev) => ({ ...prev, [key]: emoji }));
    try {
      await apiFetch('/api/moods', { method: 'POST', body: { mood: emoji } });
    } catch (err) {
      alert(`Could not save mood: ${err.message}`);
      await refresh(); // revert by reloading the truth from the server.
    }
  };

  // Used by the Insights "import JSON" feature. Now a no-op alert because
  // bulk import isn't supported by the backend yet — keeping the signature
  // so the existing UI button doesn't crash.
  const replaceData = async () => {
    alert('Bulk import is not available with backend storage yet.');
  };

  // Toggle sound on/off (runtime only).
  const toggleSound = () => setSoundEnabled((v) => !v);

  // Publish state + functions to the rest of the app.
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

// Custom hook so any component can do: const { habits, addHabit } = useHabits();
export const useHabits = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
};

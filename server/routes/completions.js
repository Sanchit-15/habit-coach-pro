// ===========================================================================
// server/routes/completions.js — Habit check-ins (one per habit per day).
// All routes assume `protect` middleware set req.user.
// ===========================================================================

import express from 'express';
import Completion from '../models/Completion.js';
import Habit from '../models/Habit.js';

const router = express.Router();

// Small helper: today's date as "YYYY-MM-DD" in local-ish ISO form.
const todayKey = () => new Date().toISOString().split('T')[0];

// -------------------------------------------------------------------------
// GET /api/completions
// Return ALL completions for the current user. The frontend groups by habit.
// -------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const completions = await Completion.find({ userId: req.user._id })
      .sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) {
    console.error('GET /completions:', err);
    res.status(500).json({ message: 'Failed to load completions' });
  }
});

// -------------------------------------------------------------------------
// POST /api/completions
// Body: { habitId, status?, reason?, dateKey? }
// Creates today's completion (or replaces it if it already exists).
// -------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { habitId, status = 'done', reason = '' } = req.body;
    const dateKey = req.body.dateKey || todayKey();

    if (!habitId) return res.status(400).json({ message: 'habitId is required' });

    // Verify the habit really belongs to this user (prevents tampering).
    const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // upsert: if a completion for this (habit, day) exists, update it; else create.
    // This satisfies the "no duplicate completion" rule while still letting
    // the user change today's status from "missed" → "done", etc.
    const completion = await Completion.findOneAndUpdate(
      { habitId, dateKey },
      {
        $set: { status, reason: status === 'missed' ? reason : '', completedAt: new Date() },
        $setOnInsert: { userId: req.user._id, habitId, dateKey },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(completion);
  } catch (err) {
    console.error('POST /completions:', err);
    res.status(500).json({ message: 'Failed to save completion' });
  }
});

// -------------------------------------------------------------------------
// DELETE /api/completions/:habitId/today
// Remove today's completion for a habit (used by the Undo toast).
// -------------------------------------------------------------------------
router.delete('/:habitId/today', async (req, res) => {
  try {
    const result = await Completion.findOneAndDelete({
      habitId: req.params.habitId,
      userId: req.user._id,
      dateKey: todayKey(),
    });
    if (!result) return res.status(404).json({ message: 'No completion to undo' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /completions/:habitId/today:', err);
    res.status(500).json({ message: 'Failed to undo completion' });
  }
});

export default router;

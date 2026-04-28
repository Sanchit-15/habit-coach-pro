// ===========================================================================
// server/routes/habits.js — CRUD for habits, scoped to the logged-in user.
// All routes assume `protect` middleware ran first and set `req.user`.
// ===========================================================================

import express from 'express';
import Habit from '../models/Habit.js';
import Completion from '../models/Completion.js';

const router = express.Router();

// -------------------------------------------------------------------------
// GET /api/habits
// Return all NON-archived habits for the current user, sorted by `order`.
// -------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, archived: false })
      .sort({ order: 1, createdAt: 1 });
    res.json(habits);
  } catch (err) {
    console.error('GET /habits:', err);
    res.status(500).json({ message: 'Failed to load habits' });
  }
});

// -------------------------------------------------------------------------
// GET /api/habits/archived
// Return only archived habits for the current user.
// NOTE: This must be defined BEFORE the "/:id" routes so Express doesn't
// treat "archived" as an :id parameter.
// -------------------------------------------------------------------------
router.get('/archived', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, archived: true })
      .sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    console.error('GET /habits/archived:', err);
    res.status(500).json({ message: 'Failed to load archived habits' });
  }
});

// -------------------------------------------------------------------------
// POST /api/habits
// Create a new habit owned by the current user.
// -------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    // Compute the next `order` so the new habit lands at the bottom of the list.
    const count = await Habit.countDocuments({ userId: req.user._id, archived: false });

    // Whitelist the fields we allow the client to set (don't trust the body blindly).
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      color: req.body.color,
      note: req.body.note,
      dueTime: req.body.dueTime || req.body.reminderTime,
      tags: req.body.tags,
      weeklyGoal: req.body.weeklyGoal,
      order: typeof req.body.order === 'number' ? req.body.order : count,
      frequency: req.body.frequency,
      time: req.body.time,
      goal: req.body.goal,
    });

    res.status(201).json(habit);
  } catch (err) {
    console.error('POST /habits:', err);
    res.status(500).json({ message: 'Failed to create habit' });
  }
});

// -------------------------------------------------------------------------
// PATCH /api/habits/reorder
// Body: { orderedIds: [habitId, habitId, ...] }
// Saves a new `order` value for each habit so the dashboard remembers it.
// Defined BEFORE "/:id" routes for the same reason as /archived.
// -------------------------------------------------------------------------
router.patch('/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds must be an array' });
    }

    // Update each habit's order in parallel. Ownership check via userId.
    await Promise.all(
      orderedIds.map((id, index) =>
        Habit.updateOne(
          { _id: id, userId: req.user._id },
          { $set: { order: index } }
        )
      )
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /habits/reorder:', err);
    res.status(500).json({ message: 'Failed to reorder' });
  }
});

// -------------------------------------------------------------------------
// PUT /api/habits/:id — Update fields on a single habit.
// -------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    // findOneAndUpdate with userId in the filter ensures ownership.
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true } // return the updated document, not the old one.
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    console.error('PUT /habits/:id:', err);
    res.status(500).json({ message: 'Failed to update habit' });
  }
});

// -------------------------------------------------------------------------
// PATCH /api/habits/:id/archive — Soft-delete (hide from dashboard).
// -------------------------------------------------------------------------
router.patch('/:id/archive', async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { archived: true } },
      { new: true }
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    console.error('PATCH /habits/:id/archive:', err);
    res.status(500).json({ message: 'Failed to archive' });
  }
});

// -------------------------------------------------------------------------
// PATCH /api/habits/:id/restore — Move an archived habit back.
// -------------------------------------------------------------------------
router.patch('/:id/restore', async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { archived: false } },
      { new: true }
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    console.error('PATCH /habits/:id/restore:', err);
    res.status(500).json({ message: 'Failed to restore' });
  }
});

// -------------------------------------------------------------------------
// DELETE /api/habits/:id — Hard-delete a habit AND all its completions.
// -------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Cascade: remove every completion that pointed at this habit.
    await Completion.deleteMany({ habitId: habit._id, userId: req.user._id });

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /habits/:id:', err);
    res.status(500).json({ message: 'Failed to delete habit' });
  }
});

export default router;

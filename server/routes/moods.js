// ===========================================================================
// server/routes/moods.js — Daily mood tracking, one entry per user per day.
// ===========================================================================

import express from 'express';
import Mood from '../models/Mood.js';

const router = express.Router();

const todayKey = () => new Date().toISOString().split('T')[0];

// -------------------------------------------------------------------------
// GET /api/moods
// Return the latest 7 mood entries for the current user (newest first).
// -------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user._id })
      .sort({ dateKey: -1 })
      .limit(7);
    res.json(moods);
  } catch (err) {
    console.error('GET /moods:', err);
    res.status(500).json({ message: 'Failed to load moods' });
  }
});

// -------------------------------------------------------------------------
// POST /api/moods
// Body: { mood, dateKey? }  → upsert one mood per (user, day).
// -------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { mood } = req.body;
    const dateKey = req.body.dateKey || todayKey();
    if (!mood) return res.status(400).json({ message: 'mood is required' });

    // findOneAndUpdate with upsert:true → creates if missing, updates if present.
    const doc = await Mood.findOneAndUpdate(
      { userId: req.user._id, dateKey },
      { $set: { mood }, $setOnInsert: { userId: req.user._id, dateKey } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(doc);
  } catch (err) {
    console.error('POST /moods:', err);
    res.status(500).json({ message: 'Failed to save mood' });
  }
});

export default router;

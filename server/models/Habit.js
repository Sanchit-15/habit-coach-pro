// ===========================================================================
// server/models/Habit.js — Mongoose model for a single habit.
// Each habit belongs to ONE user (userId). The frontend can have many habits.
// ===========================================================================

import mongoose from 'mongoose';

// Define the SHAPE of a habit document.
const habitSchema = new mongoose.Schema({
  // Reference to the User who owns this habit. `ref` lets us populate it later.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Speeds up "find all habits for this user" queries.
  },
  // Display name (e.g. "Morning Meditation").
  name: { type: String, required: true, trim: true },
  // Hex color used for the left stripe on the habit card.
  color: { type: String, default: '#2F80ED' },
  // Optional free-text note the user can attach.
  note: { type: String, default: '' },
  // Optional reminder time as "HH:MM".
  dueTime: { type: String, default: '' },
  // Free-form tags (e.g. ["health", "mindfulness"]).
  tags: { type: [String], default: [] },
  // How many times per week the user wants to do it (1-7).
  weeklyGoal: { type: Number, default: 7 },
  // Position on the dashboard (used by drag-and-drop reordering).
  order: { type: Number, default: 0 },
  // Soft-delete flag — archived habits are hidden from the dashboard.
  archived: { type: Boolean, default: false },
  // When the habit was first created.
  createdAt: { type: Date, default: Date.now },

  // ---- Extra fields kept so the existing UI doesn't break ----
  // Frequency (daily / weekdays / etc.). The UI already shows these.
  frequency: { type: String, default: 'daily' },
  // Time of day grouping ("morning" / "evening").
  time: { type: String, default: 'morning' },
  // Goal text (e.g. "10 min").
  goal: { type: String, default: '' },
});

export default mongoose.model('Habit', habitSchema);

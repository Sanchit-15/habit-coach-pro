// ===========================================================================
// server/models/Mood.js — One mood entry per user per day.
// We enforce the "one per day" rule with a compound unique index.
// ===========================================================================

import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  // Which user this mood belongs to.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The mood itself (an emoji string like "😀").
  mood: { type: String, required: true },
  // "YYYY-MM-DD" — the day this mood applies to.
  dateKey: { type: String, required: true },
  // When the row was first created.
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index: one mood per (user, day). Required by the spec.
moodSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('Mood', moodSchema);

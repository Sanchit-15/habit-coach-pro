// ===========================================================================
// server/models/Completion.js — One row per (habit, day) check-in event.
// dateKey is "YYYY-MM-DD" so it's easy to group by day and prevent duplicates.
// ===========================================================================

import mongoose from 'mongoose';

const completionSchema = new mongoose.Schema({
  // Owner of this completion (defense-in-depth: we always filter by userId too).
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Which habit was completed.
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true,
  },
  // Exact moment the user tapped "done".
  completedAt: { type: Date, default: Date.now },
  // "YYYY-MM-DD" string used to enforce one completion per habit per day.
  dateKey: { type: String, required: true },
  // 'done' / 'missed' / 'excused' — kept so analytics can show streak freezes.
  status: { type: String, default: 'done' },
  // Reason text when status === 'missed'.
  reason: { type: String, default: '' },
});

// Compound unique index: prevents inserting two completions for the same
// habit on the same day (we use upsert in the route to update instead).
completionSchema.index({ habitId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('Completion', completionSchema);

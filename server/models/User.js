// ===========================================================================
// server/models/User.js — Mongoose model for app users.
// A "model" is a JS class generated from a schema; it lets us read/write the
// "users" collection in MongoDB.
// ===========================================================================

import mongoose from 'mongoose';

// A schema defines the SHAPE of a document (a row in MongoDB terms).
const userSchema = new mongoose.Schema({
  // Display name — required so every account has something to show.
  name: { type: String, required: true },
  // Email — required, must be unique, stored lowercase to avoid duplicates
  // like "Foo@x.com" vs "foo@x.com".
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Password — stored as a bcrypt HASH, never the plain text.
  password: { type: String, required: true },
  // Timestamp set automatically when the user is created.
  createdAt: { type: Date, default: Date.now },
});

// Export the model. The string 'User' tells Mongoose to use the "users" collection.
export default mongoose.model('User', userSchema);

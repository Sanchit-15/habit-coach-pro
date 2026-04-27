// ===========================================================================
// server/routes/auth.js — Authentication routes (register + login).
// Mounted under /api/auth in server/index.js.
// ===========================================================================

import express from 'express';
// bcryptjs hashes passwords so we never store plain text in the database.
import bcrypt from 'bcryptjs';
// jsonwebtoken creates signed tokens we send to the client to prove identity.
import jwt from 'jsonwebtoken';
// Our Mongoose User model.
import User from '../models/User.js';

// A Router is a mini Express app — we attach routes to it and export it.
const router = express.Router();

// Helper: build a signed JWT for a given user id.
// The token is a string the client stores and sends back on later requests.
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// -------------------------------------------------------------------------
// POST /api/auth/register
// Body: { name, email, password }
// Creates a new user, hashes the password, returns { token, user }.
// -------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic input validation — make sure all three fields are present.
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check whether someone already signed up with this email.
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash the password with a "salt" of strength 10 (good default).
    const hashed = await bcrypt.hash(password, 10);

    // Create + save the user document in one step.
    const user = await User.create({ name, email, password: hashed });

    // Generate a JWT so the client is logged in immediately after signup.
    const token = signToken(user._id);

    // Respond WITHOUT the password field — never leak hashes to the client.
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// Verifies credentials, returns { token, user } on success.
// -------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic input validation.
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Look the user up by email (lowercased to match how we stored it).
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Use the same generic message for both "no user" and "wrong password"
      // so attackers can't tell which emails exist.
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the typed password with the stored hash.
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Success — issue a fresh JWT.
    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

// ===========================================================================
// server/middleware/protect.js — JWT authentication middleware.
// Use this on any route that should only be accessible to a logged-in user.
// It reads the "Authorization: Bearer <token>" header, verifies the token,
// loads the user from the DB, and puts them on `req.user` so the route handler
// can use it (e.g. `req.user._id` to scope queries).
// ===========================================================================

// `jsonwebtoken` lets us verify the signature of the token we issued at login.
import jwt from 'jsonwebtoken';
// We load the user so route handlers have a real user document to work with.
import User from '../models/User.js';

// Express middleware = a function with (req, res, next).
// Call next() to continue to the next handler, or send a response to stop.
export default async function protect(req, res, next) {
  try {
    // The header looks like: "Bearer eyJhbGciOi..." — split on space and take [1].
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    // No token at all → reject with 401 Unauthorized.
    if (!token) {
      return res.status(401).json({ message: 'Not authorized: missing token' });
    }

    // Verify cryptographically. Throws if the token is fake/expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up the user by the id we baked into the token at login time.
    // .select('-password') strips the password hash from the returned doc.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    // Attach the user to the request so downstream handlers can read req.user.
    req.user = user;
    // All good — continue to the actual route handler.
    next();
  } catch (err) {
    // Anything went wrong (bad signature, expired, etc.) → 401.
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Not authorized: invalid token' });
  }
}

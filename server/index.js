// ===========================================================================
// server/index.js — Express server entry point.
// Run locally with:  node server/index.js   (after `npm install` of deps)
// Make sure MongoDB is running locally OR MONGODB_URI points to Atlas.
// ===========================================================================

// `dotenv` reads the .env file and puts values onto process.env.
// Must be called BEFORE we read any process.env.* values below.
import 'dotenv/config';
// Express is the web framework that handles HTTP routes.
import express from 'express';
// Mongoose is the ODM (Object Data Modeling) library for MongoDB.
import mongoose from 'mongoose';
// CORS lets the browser (running on Vite's port 8080/5173) call this server (port 5000).
import cors from 'cors';
// Our authentication routes (register + login).
import authRoutes from './routes/auth.js';

// Create the Express application instance.
const app = express();

// Middleware: allow cross-origin requests from any origin (dev convenience).
app.use(cors());
// Middleware: parse incoming JSON request bodies into req.body.
app.use(express.json());

// Mount the auth router. Every route inside it will be prefixed with /api/auth.
// Example: POST /api/auth/login  ->  routes/auth.js handles it.
app.use('/api/auth', authRoutes);

// Simple health check route so you can verify the server is up in a browser.
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Read the port from .env, falling back to 5000 if not set.
const PORT = process.env.PORT || 5000;

// Connect to MongoDB FIRST, then start listening for requests.
// If the DB connection fails, we log it and exit so we don't run a broken server.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

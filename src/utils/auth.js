// ===========================================================================
// src/utils/auth.js — Tiny helpers for the JWT stored in the browser.
// No UI, no React — just plain functions you can import anywhere.
// ===========================================================================

// Key we use inside localStorage. Centralized so it's easy to change later.
const TOKEN_KEY = 'consistify_token';

// Read the saved token (or null if there isn't one).
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Save a token after a successful login/register response.
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Remove the token (sign out at the storage level).
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

// Base URL of the Express API. Configurable via Vite env var
// (VITE_API_URL=http://localhost:5000 in a .env file at the project root).
// Falls back to localhost:5000 for the typical local setup.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

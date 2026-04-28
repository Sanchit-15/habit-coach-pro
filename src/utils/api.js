// ===========================================================================
// src/utils/api.js — Tiny wrapper around fetch() for talking to our backend.
// Automatically attaches the JWT from localStorage and parses JSON responses.
// ===========================================================================

import { API_URL, getToken } from './auth.js';

// Friendly error class so callers can `catch (err)` and read err.status.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// The single helper used by every page/context.
//   path: a string like "/api/habits" (leading slash optional).
//   options: { method, body, headers } — body can be a plain object (we JSON it).
export async function apiFetch(path, options = {}) {
  // Build the full URL: API_URL + path, normalising the slash.
  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  // Read the JWT we saved at login. Will be null if the user isn't logged in.
  const token = getToken();

  // Compose request headers. Only set Content-Type when we have a body.
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If the caller passed a JS object as the body, stringify it for them.
  const body =
    options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body;

  let res;
  try {
    res = await fetch(url, { ...options, headers, body });
  } catch (networkErr) {
    // Network/CORS/server-down errors land here.
    throw new ApiError('Network error: backend unreachable', 0);
  }

  // 204 No Content → nothing to parse.
  if (res.status === 204) return null;

  // Try to parse JSON either way so we can read error messages from the server.
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* response had no JSON body — that's fine for some endpoints */
  }

  if (!res.ok) {
    const msg = (data && data.message) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  return data;
}

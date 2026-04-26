// ===========================================================================
// main.jsx — The very first JavaScript file the browser runs.
// Think of this as the "ignition switch" that starts the React app.
// ===========================================================================

// Bring in the React library so we can use React features (like <App />, JSX, etc.).
import React from 'react';
// `createRoot` is the modern way to tell React: "Here is the spot in the page to draw into."
import { createRoot } from 'react-dom/client';
// Import our top-level component (the whole app lives inside <App />).
import App from './App.jsx';
// Import the global stylesheet — colors, fonts, spacing tokens used across pages.
import './styles/global.css';

// 1. Find the <div id="root"></div> element inside index.html.
// 2. Hand it to React so React can manage everything inside it.
// 3. Call .render(...) and pass the JSX we want to display.
createRoot(document.getElementById('root')).render(
  // <React.StrictMode> is a development helper. It runs extra checks
  // and warns about unsafe patterns. It does NOT render anything visible.
  <React.StrictMode>
    {/* <App /> is our root component — it contains routing and every page. */}
    <App />
  </React.StrictMode>
);

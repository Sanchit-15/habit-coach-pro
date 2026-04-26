// ===========================================================================
// AppLayout.jsx — The shared "frame" wrapped around every logged-in page.
// It provides:
//   - The sidebar (left navigation).
//   - A small header on mobile with a hamburger button to open the sidebar.
//   - A <main> area where the actual page content (children) is shown.
// ===========================================================================

// useState is a React Hook. A "Hook" is a special function that lets a
// component remember information between re-renders.
// Here we use it to track whether the mobile sidebar is open or closed.
import { useState } from 'react';
// Import the Sidebar component we will render inside the layout.
import Sidebar from './Sidebar.jsx';
// Import the layout-specific styles (mobile header, content area, etc.).
import './AppLayout.css';

// `children` is a built-in React prop that contains whatever JSX you put
// between the opening and closing tags of <AppLayout>...</AppLayout>.
// Example: <AppLayout><Dashboard /></AppLayout>  -> children = <Dashboard />
export default function AppLayout({ children }) {
  // useState returns an array of two things:
  //   1. The current value (sidebarOpen)
  //   2. A function to update it (setSidebarOpen)
  // We start with `false` because the sidebar is hidden by default on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The component's "return" is the JSX (HTML-like) that React will draw.
  return (
    // A wrapper <div> with a CSS class. In JSX we use `className` instead of `class`.
    <div className="app-layout">
      {/* Mobile-only header bar. CSS hides this on bigger screens. */}
      <div className="mobile-header">
        {/* When the hamburger is clicked, set sidebarOpen to true. */}
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          {/* Three <span> bars create the classic hamburger icon visually. */}
          <span /><span /><span />
        </button>
        {/* Brand name shown next to the hamburger. Inline `style` uses an object. */}
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>CONSISTIFY</span>
      </div>
      {/* Pass the open/close state down to Sidebar as props. */}
      {/* Sidebar will call onClose() when the user taps outside or a link. */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* <main> is a semantic HTML tag for the main page content. */}
      <main className="app-content">
        {/* Whatever page was passed in (Dashboard, Settings, etc.) renders here. */}
        {children}
      </main>
    </div>
  );
}

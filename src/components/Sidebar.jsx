// ===========================================================================
// Sidebar.jsx — The navigation panel on the left (or bottom on mobile).
// It shows nav links, the user's name/email, and a logout button.
// ===========================================================================

// React Router gives us:
// - NavLink: like an <a> tag, but it knows when the URL matches its `to`,
//            so it can apply an "active" CSS class automatically.
// - useNavigate: a hook that returns a function to change the URL in code.
import { NavLink, useNavigate } from 'react-router-dom';
// Import the auth context hook so we can read the logged-in user + log them out.
import { useAuth } from '../context/AuthContext.jsx';
// Theme context hook (currently imported in case we add a theme toggle here).
import { useTheme } from '../context/ThemeContext.jsx';
// Sidebar-specific styles (positioning, colors, mobile bottom-bar layout).
import './Sidebar.css';

// A plain JavaScript array describing each nav link.
// Storing them as data lets us render them in a simple loop instead of repeating JSX.
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/habits',    label: 'My Habits', icon: '✅' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/reports',   label: 'Reports',   icon: '📋' },
  { path: '/insights',  label: 'Insights',  icon: '💡' },
  { path: '/archive',   label: 'Archive',   icon: '📦' },
  { path: '/settings',  label: 'Settings',  icon: '⚙️' },
];

// Props arrive as a single object that we destructure: { isOpen, onClose }.
// - isOpen: boolean, true when the mobile sidebar should be visible.
// - onClose: function the parent gave us to close the sidebar.
export default function Sidebar({ isOpen, onClose }) {
  // Pull the current user and a logout() function from the auth context.
  const { user, logout } = useAuth();
  // Pull theme info (kept for future use; safe even if unused).
  const { theme, toggleTheme } = useTheme();
  // Get the navigate() function so we can change pages from JS code.
  const navigate = useNavigate();

  // Helper called when the user clicks the Logout button.
  const handleLogout = () => {
    logout();          // Clear the user from auth context.
    navigate('/');     // Send them back to the public Home page.
  };

  return (
    // <> ... </> is a "Fragment" — it lets us return multiple elements
    // without adding an extra wrapping <div> to the DOM.
    <>
      {/* Dark transparent backdrop on mobile. Tapping it closes the sidebar. */}
      {/* Template literals (backticks) build the className conditionally. */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      {/* <aside> is a semantic tag for side content like a sidebar. */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top section: brand logo + name */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">C</div>
            CONSISTIFY
          </div>
        </div>
        {/* <nav> is a semantic tag for navigation links. */}
        <nav className="sidebar-nav">
          {/* .map() creates one NavLink per item in the navItems array. */}
          {/* `key` is a special prop React needs to track items in a list. */}
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              // NavLink lets className be a function that receives { isActive }.
              // We use that to add the "active" class only on the matching link.
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              // When the user picks a link on mobile, also close the drawer.
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* Footer: user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {/* Optional chaining (?.) safely accesses properties even if user is null. */}
            {/* Show the first letter of the name as an avatar, or 'U' fallback. */}
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              {/* Show the user's display name, or 'User' if missing. */}
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              {/* Show the user's email, or empty string if missing. */}
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
          {/* Logout button calls the helper above. */}
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

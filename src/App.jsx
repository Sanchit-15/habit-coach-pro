// ===========================================================================
// App.jsx — The root component of the app.
// Its job is to:
//   1. Wrap the app in "providers" (global data like theme, auth, habits).
//   2. Define every URL route (e.g. /dashboard, /login) and which page shows.
//   3. Mount the global confetti overlay once for the whole app.
// ===========================================================================

// React Router gives us URL-based navigation without reloading the page.
// - BrowserRouter: enables routing using the browser's address bar.
// - Routes: a container that picks ONE matching <Route> to render.
// - Route: a single mapping from a URL path to a page.
// - Navigate: a component that redirects the user to another URL.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import our context providers. A "Provider" makes data available
// to every component inside it — like a shared box of data.
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { HabitProvider } from './context/HabitContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Import every page component. Each page is a function that returns JSX.
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyHabits from './pages/MyHabits.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import Insights from './pages/Insights.jsx';
import Settings from './pages/Settings.jsx';
import Archive from './pages/Archive.jsx';

// AppLayout wraps logged-in pages with the sidebar and main content area.
import AppLayout from './components/AppLayout.jsx';
// GlobalConfetti is the fullscreen celebration animation that fires when
// a habit is completed. It listens to a flag in HabitContext.
import GlobalConfetti from './components/GlobalConfetti.jsx';

// ---------------------------------------------------------------------------
// ProtectedRoute — a small helper component.
// Purpose: if the user is NOT logged in or NOT onboarded, send them away.
// `children` is a special prop: it's whatever JSX is placed inside the tag.
// Example: <ProtectedRoute><Dashboard /></ProtectedRoute> -> children = <Dashboard />
// ---------------------------------------------------------------------------
function ProtectedRoute({ children }) {
  // useAuth() is a custom hook that returns auth data from AuthContext.
  // We pull out the current `user` and whether they finished onboarding.
  const { user, isOnboarded } = useAuth();
  // No user logged in? Redirect to /login by rendering a <Navigate>.
  if (!user) return <Navigate to="/login" />;
  // Logged in but hasn't gone through onboarding? Send them to /onboarding.
  if (!isOnboarded) return <Navigate to="/onboarding" />;
  // Otherwise, render whatever was passed in (the protected page).
  return children;
}

// ---------------------------------------------------------------------------
// OnboardingRoute — same idea, but specifically guards the /onboarding URL.
// Sends logged-out users to /login, and already-onboarded users straight to /dashboard.
// ---------------------------------------------------------------------------
function OnboardingRoute({ children }) {
  const { user, isOnboarded } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (isOnboarded) return <Navigate to="/dashboard" />;
  return children;
}

// ---------------------------------------------------------------------------
// AppRoutes — defines every URL the app responds to.
// We separate this into its own component so it can call useAuth()
// (hooks can only be used INSIDE a component, not at file top level).
// ---------------------------------------------------------------------------
function AppRoutes() {
  // Read the current user from auth context so we can redirect from "/" if logged in.
  const { user } = useAuth();

  // <Routes> picks the first <Route> whose `path` matches the URL.
  return (
    <Routes>
      {/* Landing page: if logged in, jump to dashboard, else show Home. */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      {/* Login screen — but if already logged in, skip straight to dashboard. */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      {/* Signup screen — same redirect logic as Login. */}
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      {/* Onboarding — wrapped so unauthorized users get redirected away. */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      {/* Each protected page: wrapped in ProtectedRoute + AppLayout (sidebar). */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><AppLayout><MyHabits /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
      <Route path="/archive" element={<ProtectedRoute><AppLayout><Archive /></AppLayout></ProtectedRoute>} />
      {/* Catch-all: any unknown URL redirects back to "/". */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// ---------------------------------------------------------------------------
// App — the default export, called once from main.jsx.
// Notice the order of providers: the OUTER one is available to all inner ones.
//   ThemeProvider  -> light/dark theme available everywhere
//   AuthProvider   -> user info available everywhere (even to HabitProvider)
//   HabitProvider  -> habits + moods + confetti flag available everywhere
//   BrowserRouter  -> URL routing for the page tree
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HabitProvider>
          <BrowserRouter>
            {/* Page content based on the current URL */}
            <AppRoutes />
            {/* The fullscreen confetti overlay sits on top of everything */}
            <GlobalConfetti />
          </BrowserRouter>
        </HabitProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

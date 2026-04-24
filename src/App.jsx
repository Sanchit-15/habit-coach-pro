import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { HabitProvider } from './context/HabitContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
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
import AppLayout from './components/AppLayout.jsx';

function ProtectedRoute({ children }) {
  const { user, isOnboarded } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isOnboarded) return <Navigate to="/onboarding" />;
  return children;
}

function OnboardingRoute({ children }) {
  const { user, isOnboarded } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (isOnboarded) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><AppLayout><MyHabits /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
      <Route path="/archive" element={<ProtectedRoute><AppLayout><Archive /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HabitProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </HabitProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

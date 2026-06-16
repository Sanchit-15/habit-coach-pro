// AuthContext.jsx — The shared "box" that holds login info.
//
// Why use Context?
//   Without it, you'd have to pass `user` as a prop through every component.
//   Context lets ANY component read or update shared data directly.
//
// This file exports:
//   - AuthProvider: wrap your app with this so the data is available.
//   - useAuth():    a custom hook that reads/writes that data from anywhere.
// ===========================================================================

// Bring in the React APIs we need:
//  - createContext: makes a new "box" for shared data.
//  - useContext:    reads the data out of a box.
//  - useState:      stores values that change over time inside a component.
//  - useEffect:     runs side effects (like syncing with localStorage).
import { createContext, useContext, useState, useEffect } from 'react';
import { logout as clearToken } from '../utils/auth.js';

// Create the empty Context box. The `null` is just the default value
// used when no Provider is wrapping the app (we treat that as an error).
const AuthContext = createContext(null);

// AuthProvider is a component that "fills" the box with real values
// and renders its children inside. Anyone inside can use those values.
export function AuthProvider({ children }) {
  // The currently logged-in user object, or null when nobody is logged in.
  // Initialize from localStorage so user stays logged in after refresh.
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('consistify_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Whether the user has finished the onboarding wizard.
  // Initialize from localStorage to persist across refresh.
  const [isOnboarded, setIsOnboarded] = useState(() => {
    try {
      const saved = localStorage.getItem('consistify_onboarded');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Whenever user changes, persist it to localStorage.
  useEffect(() => {
    if (user) {
      localStorage.setItem('consistify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('consistify_user');
    }
  }, [user]);

  // Whenever onboarding status changes, persist it to localStorage.
  useEffect(() => {
    localStorage.setItem('consistify_onboarded', JSON.stringify(isOnboarded));
  }, [isOnboarded]);

  // Fake login function. In a real app this would call an API.
  // Here we accept the name and email from the login response.
  const login = (email, name) => {
    setUser({ email, name });
  };

  // Fake signup function — same idea, but we accept the name explicitly.
  const signup = (name, email, password) => {
    setUser({ email, name });
  };

  // Clear the session and reset onboarding so the user starts fresh.
  const logout = () => {
    clearToken(); // Also clear the JWT token from localStorage
    setUser(null);
    setIsOnboarded(false);
  };

  // Mark onboarding as complete (called from the last onboarding step).
  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  // The Provider component "publishes" the value object to all children.
  // Anything inside <AuthContext.Provider> can now read these via useAuth().
  return (
    <AuthContext.Provider value={{ user, isOnboarded, login, signup, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook: a normal function whose name starts with "use".
// This pattern is the cleanest way to expose context data to components.
export const useAuth = () => {
  // Read the current value of AuthContext (whatever the Provider published).
  const ctx = useContext(AuthContext);
  // Defensive check: if a component forgets to wrap itself in <AuthProvider>,
  // throw a clear error instead of crashing in a confusing way later.
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  // Return the shared object so the calling component can destructure what it needs.
  return ctx;
};

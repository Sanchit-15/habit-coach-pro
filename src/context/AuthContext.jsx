import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const login = (email, password) => {
    setUser({ email, name: email.split('@')[0] });
  };

  const signup = (name, email, password) => {
    setUser({ email, name });
  };

  const logout = () => {
    setUser(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  return (
    <AuthContext.Provider value={{ user, isOnboarded, login, signup, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ===========================================================================
// ThemeContext.jsx — Global "light vs dark" theme state.
//
// It exposes:
//   - theme:       the current theme string ('light' or 'dark').
//   - toggleTheme: a function that flips between the two.
//
// It also writes the theme to <html data-theme="..."> so CSS variables
// in global.css can switch colors automatically.
// ===========================================================================

// React APIs we need (see AuthContext for what each one does).
// useEffect lets us run code AFTER render — perfect for touching the DOM.
import { createContext, useContext, useState, useEffect } from 'react';

// Create the empty context box.
const ThemeContext = createContext(null);

// Provider component. Wrap the app with this so the theme is available everywhere.
export function ThemeProvider({ children }) {
  // Default theme is 'light'.
  const [theme, setTheme] = useState('light');

  // useEffect runs the setup function after each render.
  // The dependency array [theme] means: "run again only when `theme` changes".
  useEffect(() => {
    // Set an attribute on the <html> element. Our CSS uses
    // [data-theme="dark"] selectors to swap colors.
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Function that flips the theme. Using the "updater" form (prev => ...)
  // is safest because it always reads the latest value.
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Publish the value to all children inside this Provider.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook so components can do: const { theme, toggleTheme } = useTheme();
export const useTheme = () => useContext(ThemeContext);

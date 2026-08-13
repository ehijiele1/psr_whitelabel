'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

type Theme = 'professional' | 'premium';

const STORAGE_KEY = 'psr_theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSnapshot(): Theme {
  if (typeof window !== 'undefined') {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (savedTheme === 'professional' || savedTheme === 'premium') {
      return savedTheme;
    }
  }
  return 'professional';
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => 'professional');

  const setTheme = useCallback((newTheme: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, newTheme);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === 'professional' ? 'premium' : 'professional');
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

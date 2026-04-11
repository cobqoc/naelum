'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: EffectiveTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

function getSystemThemeStatic(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): { theme: Theme; effective: EffectiveTheme } {
  if (typeof window === 'undefined') return { theme: 'system', effective: 'dark' };
  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    const effective = savedTheme === 'system' ? getSystemThemeStatic() : savedTheme;
    return { theme: savedTheme, effective };
  }
  const effective = getSystemThemeStatic();
  localStorage.setItem('theme', 'system');
  return { theme: 'system', effective };
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme().theme);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => getInitialTheme().effective);

  // Get system theme preference
  const getSystemTheme = (): EffectiveTheme => {
    return getSystemThemeStatic();
  };

  // Calculate effective theme based on current theme setting
  const calculateEffectiveTheme = (currentTheme: Theme): EffectiveTheme => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  useEffect(() => {
    // Apply theme to document on mount
    const effective = calculateEffectiveTheme(theme);
    document.documentElement.setAttribute('data-theme', effective);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Listen for system theme changes when theme is set to 'system'
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const effective = calculateEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    document.documentElement.setAttribute('data-theme', effective);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

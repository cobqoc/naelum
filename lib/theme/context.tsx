'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

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

// Calculate effective theme based on current theme setting (순수 — 컴포넌트 밖으로 올려 setTheme 을 안정 참조로)
function calculateEffectiveTheme(currentTheme: Theme): EffectiveTheme {
  if (currentTheme === 'system') {
    return getSystemThemeStatic();
  }
  return currentTheme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // mount 시 1회만 localStorage·matchMedia 읽기 (이전엔 두 useState 초기화가 각각 호출해 2회). 결과 동일.
  const [initial] = useState(getInitialTheme);
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(initial.effective);

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

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const effective = calculateEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    document.documentElement.setAttribute('data-theme', effective);
  }, []);

  // 값이 실제로 바뀔 때만 새 객체 — 소비처 불필요 리렌더 방지 (perf 2026-09-27).
  const value = useMemo(() => ({ theme, setTheme, effectiveTheme }), [theme, setTheme, effectiveTheme]);

  return (
    <ThemeContext.Provider value={value}>
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

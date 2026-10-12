'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { brand } from '@/lib/brand';

export type ThemePreference = 'light' | 'dark' | 'system';
type ThemeContextValue = {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
const validPreference = (value: string | null | undefined): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system';

function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
  const themeMeta = document.getElementById('app-theme-color') || document.createElement('meta');
  themeMeta.id = 'app-theme-color';
  themeMeta.setAttribute('name', 'theme-color');
  themeMeta.setAttribute('content', resolved === 'dark' ? '#121810' : '#f5f4ee');
  if (!themeMeta.parentNode) document.head.appendChild(themeMeta);
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setCurrent] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const setPreference = useCallback((next: ThemePreference) => {
    setCurrent(next);
    setResolved(applyTheme(next));
    try {
      localStorage.setItem(brand.themeStorageKey, next);
    } catch {
      /* The active preference still works when browser storage is blocked. */
    }
  }, []);
  useEffect(() => {
    const initial = validPreference(document.documentElement.dataset.themePreference);
    setCurrent(initial);
    setResolved(applyTheme(initial));
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const changeSystem = () => {
      if (document.documentElement.dataset.themePreference === 'system')
        setResolved(applyTheme('system'));
    };
    const changeStorage = (event: StorageEvent) => {
      if (event.key !== brand.themeStorageKey && event.key !== null) return;
      const next = validPreference(event.newValue);
      setCurrent(next);
      setResolved(applyTheme(next));
    };
    media.addEventListener('change', changeSystem);
    window.addEventListener('storage', changeStorage);
    return () => {
      media.removeEventListener('change', changeSystem);
      window.removeEventListener('storage', changeStorage);
    };
  }, []);
  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('Theme controls require ThemeProvider.');
  return value;
}

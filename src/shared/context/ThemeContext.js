import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LightColors, DarkColors} from '../constants/colors';

const STORAGE_KEY = '@theme';
const ThemeContext = createContext(null);

export function ThemeProvider({children}) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(val => { if (val === 'dark') setIsDark(true); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(v => {
      const next = !v;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    isDark,
    colors: isDark ? DarkColors : LightColors,
    toggleTheme,
  }), [isDark, toggleTheme]);

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

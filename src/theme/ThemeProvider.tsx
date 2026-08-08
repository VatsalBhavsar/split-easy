import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AppColors, getColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: AppColors;
  effectiveMode: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = '@theme-mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') setMode(saved);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  const effectiveMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const colors = useMemo(() => getColors(effectiveMode), [effectiveMode]);

  const handleSetThemeMode = useCallback(async (next: ThemeMode) => {
    setMode(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const value = useMemo(
    () => ({ themeMode: mode, setThemeMode: handleSetThemeMode, colors, effectiveMode }),
    [mode, handleSetThemeMode, colors, effectiveMode],
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeMode must be used within ThemeProvider');
  return value;
}

export function useAppTheme(): AppColors {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used within ThemeProvider');
  return value.colors;
}

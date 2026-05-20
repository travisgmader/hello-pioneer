/**
 * useTheme — reads the theme setting with MMKV override and system fallback.
 *
 * Priority:
 *   1. MMKV key "theme.override" ('light' | 'dark' | 'system') — set by Settings screen
 *   2. System scheme from useColorScheme() ('light' | 'dark' | null)
 *   3. Hard default: 'dark' (DESIGN-01 — dark-first)
 *
 * "system" override means: use the device's current color scheme (same as no override).
 *
 * Returns { theme, setTheme }:
 *   theme: 'light' | 'dark' — the resolved theme (never 'system')
 *   setTheme: writes to MMKV key "theme.override"; triggers reactive re-render
 *     via useMMKVString subscriber
 */

import { useColorScheme } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface UseThemeResult {
  theme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
}

export function useTheme(): UseThemeResult {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useMMKVString('theme.override');

  let resolved: ResolvedTheme;

  if (override === 'light') {
    resolved = 'light';
  } else if (override === 'dark') {
    resolved = 'dark';
  } else {
    // 'system' or absent — fall back to device color scheme; default 'dark' (DESIGN-01)
    resolved = (systemScheme ?? 'dark') as ResolvedTheme;
  }

  const setTheme = (preference: ThemePreference): void => {
    setOverride(preference);
  };

  return { theme: resolved, setTheme };
}

/**
 * ThemeProvider — reconciles OS preference with family_settings.theme.
 *
 * On first mount, applies the OS default (dark → Midnight, light → Lavender).
 * Once the family loads from Supabase, family_settings.theme overrides the
 * OS preference — satisfying D-15's "family-wide, all-devices" requirement.
 *
 * Activation uses the data-theme attribute on documentElement:
 *   - Midnight: document.documentElement.setAttribute('data-theme', 'midnight')
 *   - Lavender: document.documentElement.removeAttribute('data-theme')
 *
 * The ThemeToggle (01-04b) writes user changes to Postgres via useFamilySettings.
 * The realtime bridge invalidates ['current-family'] on other devices. This
 * component then re-reads family_settings.theme and applies the new value —
 * closing the cross-device sync loop without polling.
 *
 * The Family Creation Wizard (Plan 05) INSERTs family_settings.theme on submit
 * with the OS default. Subsequent user changes flow through ThemeToggle.
 */
import { useEffect, type ReactNode } from 'react';
import { useCurrentFamily } from '../data/useCurrentFamily';

function osDefault(): 'lavender' | 'midnight' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'midnight'
    : 'lavender';
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: family } = useCurrentFamily();

  useEffect(() => {
    const theme =
      (family?.family_settings?.theme as 'lavender' | 'midnight' | undefined) ??
      osDefault();

    if (theme === 'midnight') {
      document.documentElement.setAttribute('data-theme', 'midnight');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [family]);

  return <>{children}</>;
}

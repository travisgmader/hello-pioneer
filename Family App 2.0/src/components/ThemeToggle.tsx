/**
 * ThemeToggle — inline chip pair for selecting Lavender or Midnight theme.
 *
 * Clicking a chip:
 * 1. Immediately applies the DOM attribute (optimistic UI — instant visual feedback).
 * 2. Calls useFamilySettings().mutate({ theme }) to PATCH family_settings.theme
 *    in Postgres.
 *
 * This delivers D-15: family-wide, all-devices theme persistence. The DB write
 * propagates via the realtime bridge to any other signed-in device on the same
 * family, causing ThemeProvider to re-read and apply the new theme within ~1 second.
 *
 * DOM application is optimistic — it fires before the network round-trip so the
 * user sees instant feedback. If the mutation fails, ThemeProvider's next render
 * (on re-query after error) will reconcile back to the last persisted value.
 *
 * When no family exists yet (user is in the creation wizard pre-submit),
 * mutate is skipped — the wizard's INSERT in Plan 05 will set theme directly.
 */
import { useCurrentFamily } from '../data/useCurrentFamily';
import { useFamilySettings } from '../data/useFamilySettings';
import styles from './ThemeToggle.module.css';

function osDefault(): 'lavender' | 'midnight' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'midnight'
    : 'lavender';
}

export default function ThemeToggle() {
  const { data: family } = useCurrentFamily();
  const settingsMutation = useFamilySettings();

  const currentTheme: 'lavender' | 'midnight' =
    (family?.family_settings?.theme as 'lavender' | 'midnight' | undefined) ??
    osDefault();

  const setTheme = (next: 'lavender' | 'midnight'): void => {
    // 1. Optimistic DOM update — instant visual feedback
    if (next === 'midnight') {
      document.documentElement.setAttribute('data-theme', 'midnight');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // 2. Persist to Postgres via useFamilySettings → propagates to all devices
    if (family?.family_settings) {
      settingsMutation.mutate({ theme: next });
    }
  };

  return (
    <div className={styles.chipPair}>
      <button
        type="button"
        className={styles.chip}
        data-active={currentTheme === 'lavender'}
        disabled={settingsMutation.isPending}
        onClick={() => setTheme('lavender')}
      >
        Lavender
      </button>
      <button
        type="button"
        className={styles.chip}
        data-active={currentTheme === 'midnight'}
        disabled={settingsMutation.isPending}
        onClick={() => setTheme('midnight')}
      >
        Midnight
      </button>
    </div>
  );
}

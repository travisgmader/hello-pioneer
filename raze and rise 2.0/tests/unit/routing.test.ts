/**
 * Plan 01d — Routing scaffold tests
 * Verifies that all required Expo Router layout and screen files exist with the
 * correct exports and key patterns. These tests run in Node environment via Vitest
 * and check file system + static content — no React rendering required.
 *
 * TDD RED: written before app/ files exist; will pass once Task 1 + Task 2 are complete.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../');
const file = (p: string) => resolve(ROOT, p);
const read = (p: string) => readFileSync(file(p), 'utf8');
const exists = (p: string) => existsSync(file(p));

// ─── Task 1: Layout files ───────────────────────────────────────────────────

describe('app/_layout.tsx — root layout', () => {
  it('file exists', () => {
    expect(exists('app/_layout.tsx')).toBe(true);
  });

  it('imports useSession', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('useSession');
  });

  it('imports useOnboardingState', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('useOnboardingState');
  });

  it('imports useMigrationStatus', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('useMigrationStatus');
  });

  it('calls powersync.init()', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('powersync.init()');
  });

  it('calls powersync.connect', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('powersync.connect');
  });

  it('routes to (auth) when no session', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('(auth)');
  });

  it('routes to /migration for pending/in_progress/failed status', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('/migration');
  });

  it('routes to (tabs) when session + onboarded', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('(tabs)');
  });

  it('routes to (onboarding) when not onboarded', () => {
    const content = read('app/_layout.tsx');
    expect(content).toContain('(onboarding)');
  });
});

describe('app/(auth)/_layout.tsx — auth layout', () => {
  it('file exists', () => {
    expect(exists('app/(auth)/_layout.tsx')).toBe(true);
  });

  it('contains Stack', () => {
    const content = read('app/(auth)/_layout.tsx');
    expect(content).toContain('Stack');
  });
});

describe('app/(onboarding)/_layout.tsx — onboarding layout', () => {
  it('file exists', () => {
    expect(exists('app/(onboarding)/_layout.tsx')).toBe(true);
  });

  it('contains Stack', () => {
    const content = read('app/(onboarding)/_layout.tsx');
    expect(content).toContain('Stack');
  });

  it('uses slide_from_right animation', () => {
    const content = read('app/(onboarding)/_layout.tsx');
    expect(content).toContain('slide_from_right');
  });
});

describe('app/(tabs)/_layout.tsx — tab navigator', () => {
  it('file exists', () => {
    expect(exists('app/(tabs)/_layout.tsx')).toBe(true);
  });

  it('contains exactly 5 Tabs.Screen entries', () => {
    const content = read('app/(tabs)/_layout.tsx');
    const matches = content.match(/Tabs\.Screen/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(5);
  });

  it('uses haptic feedback (selectionAsync)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('selectionAsync');
  });

  it('uses accent active tint color (#F2CA50)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('#F2CA50');
  });

  it('includes LayoutDashboard icon (Dashboard tab)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('LayoutDashboard');
  });

  it('includes Dumbbell icon (Workouts tab)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('Dumbbell');
  });

  it('includes CalendarDays icon (Split tab)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('CalendarDays');
  });

  it('includes LineChart icon (Progress tab)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('LineChart');
  });

  it('includes Settings icon (Settings tab)', () => {
    const content = read('app/(tabs)/_layout.tsx');
    expect(content).toContain('Settings');
  });
});

// ─── Task 2: Screen stubs ────────────────────────────────────────────────────

describe('app/(auth) screens', () => {
  it('index.tsx exists', () => {
    expect(exists('app/(auth)/index.tsx')).toBe(true);
  });

  it('forgot-password.tsx exists', () => {
    expect(exists('app/(auth)/forgot-password.tsx')).toBe(true);
  });
});

describe('app/(onboarding) screens', () => {
  it('profile.tsx exists', () => {
    expect(exists('app/(onboarding)/profile.tsx')).toBe(true);
  });
});

describe('app/(tabs) screens', () => {
  it('index.tsx (Dashboard) exists', () => {
    expect(exists('app/(tabs)/index.tsx')).toBe(true);
  });

  it('workouts.tsx exists', () => {
    expect(exists('app/(tabs)/workouts.tsx')).toBe(true);
  });

  it('split.tsx exists', () => {
    expect(exists('app/(tabs)/split.tsx')).toBe(true);
  });

  it('progress.tsx exists', () => {
    expect(exists('app/(tabs)/progress.tsx')).toBe(true);
  });

  it('settings.tsx exists', () => {
    expect(exists('app/(tabs)/settings.tsx')).toBe(true);
  });

  it('Dashboard stub has no Start workout button', () => {
    const content = read('app/(tabs)/index.tsx');
    expect(content).not.toMatch(/Start workout|startWorkout/);
  });

  it('Dashboard stub has correct Phase 2 copy', () => {
    const content = read('app/(tabs)/index.tsx');
    expect(content).toContain('Real workout logging ships in Phase 2');
  });

  it('Dashboard stub has __DEV__ PowerSync status indicator', () => {
    const content = read('app/(tabs)/index.tsx');
    expect(content).toContain('__DEV__');
  });

  it('Settings has Alert.alert for sign out', () => {
    const content = read('app/(tabs)/settings.tsx');
    expect(content).toContain('Alert.alert');
  });

  it('Settings has sign out functionality', () => {
    const content = read('app/(tabs)/settings.tsx');
    expect(content).toMatch(/Sign out|signOut|sign out/);
  });

  it('Settings uses useTheme hook', () => {
    const content = read('app/(tabs)/settings.tsx');
    expect(content).toContain('useTheme');
  });
});

describe('app/migration.tsx', () => {
  it('file exists', () => {
    expect(exists('app/migration.tsx')).toBe(true);
  });
});

describe('app/+not-found.tsx', () => {
  it('file exists', () => {
    expect(exists('app/+not-found.tsx')).toBe(true);
  });
});

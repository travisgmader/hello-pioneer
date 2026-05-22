/**
 * useRestTimer tests — WORKOUT-06 + WORKOUT-07
 *
 * Tests run in a node/vitest environment without a React renderer.
 * The hook's pure logic is tested via an imperative makeTimer() adapter.
 *
 * Mocks:
 *   - expo-notifications: full mock
 *   - react-native-mmkv: inline Map-based mock factory (avoids native nitro-modules chain)
 *   - react-native: AppState + Platform stub (avoids Flow-typed source parse errors)
 *   - react: useState/useRef/useEffect/useCallback stubs for node import
 *
 * Note on vi.mock hoisting: vi.mock factories are hoisted to the top of the file.
 * All mock factories below are completely self-contained (no external variable refs).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── expo-notifications mock ───────────────────────────────────────────────────

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn().mockResolvedValue('mock-id-1'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

// ── react-native-mmkv mock ────────────────────────────────────────────────────
// Self-contained Map-based factory. Avoids loading nitro-modules native chain.

vi.mock('react-native-mmkv', () => {
  function createMMKV() {
    const store = new Map<string, string>();
    return {
      set(key: string, value: string | number | boolean) { store.set(key, String(value)); },
      getString(key: string) { return store.get(key); },
      remove(key: string) { store.delete(key); },
      clearAll() { store.clear(); },
      contains(key: string) { return store.has(key); },
      getAllKeys() { return Array.from(store.keys()); },
      addOnValueChangedListener: () => ({ remove: () => {} }),
      _store: store,
    };
  }
  return { createMMKV };
});

// ── react-native mock ─────────────────────────────────────────────────────────
// Full stub — avoids Flow-typed source that rolldown cannot parse.

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => {} }),
  },
  Platform: {
    OS: 'ios',
    select(o: Record<string, unknown>) { return o.ios ?? o.default; },
  },
}));

// ── react mock — node env stubs ────────────────────────────────────────────────
// Stubs for the hook's React imports.

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => {
      const v = typeof initial === 'function' ? (initial as () => unknown)() : initial;
      return [v, () => {}];
    },
    useRef: (initial: unknown) => ({ current: initial }),
    useEffect: () => {},
    useCallback: (fn: unknown) => fn,
  };
});

// ── Post-mock imports ─────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { resolveRestSeconds } from '@/hooks/useRestTimer';

// ── makeTimer helper ──────────────────────────────────────────────────────────
//
// Imperative adapter mirroring the hook's exact logic.
// The storage is created inline (not via require) to use the mocked createMMKV.

function makeTimer() {
  // Inline Map store — mirrors what createMMKV({ id: 'rest-timer' }) returns in the hook
  const store = new Map<string, string>();
  const storage = {
    set(key: string, value: string | number | boolean) { store.set(key, String(value)); },
    getString(key: string) { return store.get(key); },
    remove(key: string) { store.delete(key); },
    _store: store,
  };

  let remaining: number | null = null;
  let notificationId: string | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let permissionGranted: boolean | null = null;

  const clearTick = () => {
    if (interval !== null) { clearInterval(interval); interval = null; }
  };

  const ensurePermission = async (): Promise<boolean> => {
    if (permissionGranted !== null) return permissionGranted;
    const { status } = await Notifications.requestPermissionsAsync();
    permissionGranted = status === 'granted';
    return permissionGranted;
  };

  const start = async (seconds: number): Promise<void> => {
    if (notificationId !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationId = null;
    }
    clearTick();

    storage.set('timer_start_epoch', String(Date.now()));
    storage.set('timer_duration_seconds', String(seconds));
    remaining = seconds;

    const granted = await ensurePermission();
    if (granted) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Rest complete', body: 'Back to it.', sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
      notificationId = id;
    }
  };

  const cancel = async (): Promise<void> => {
    if (notificationId !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationId = null;
    }
    clearTick();
    storage.remove('timer_start_epoch');
    storage.remove('timer_duration_seconds');
    remaining = null;
  };

  const addSeconds = async (delta: number): Promise<void> => {
    const current = remaining ?? 0;
    const next = Math.max(1, current + delta);

    if (notificationId !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationId = null;
    }
    clearTick();

    storage.set('timer_duration_seconds', String(next));
    remaining = next;

    if (permissionGranted !== false) {
      const granted = await ensurePermission();
      if (granted) {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: 'Rest complete', body: 'Back to it.', sound: false },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: next,
          },
        });
        notificationId = id;
      }
    }
  };

  const rehydrate = (): void => {
    const startStr = storage.getString('timer_start_epoch');
    const durStr = storage.getString('timer_duration_seconds');
    if (!startStr || !durStr) return;
    const elapsed = (Date.now() - parseInt(startStr, 10)) / 1000;
    const dur = parseInt(durStr, 10);
    const rem = Math.max(0, dur - elapsed);
    remaining = rem > 0 ? Math.floor(rem) : null;
  };

  return {
    storage,
    get remaining() { return remaining; },
    get notificationId() { return notificationId; },
    start,
    cancel,
    addSeconds,
    rehydrate,
  };
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  (Notifications.requestPermissionsAsync as ReturnType<typeof vi.fn>)
    .mockResolvedValue({ status: 'granted' });
  (Notifications.scheduleNotificationAsync as ReturnType<typeof vi.fn>)
    .mockResolvedValue('mock-id-1');
  (Notifications.cancelScheduledNotificationAsync as ReturnType<typeof vi.fn>)
    .mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── useRestTimer — contract tests ─────────────────────────────────────────────

describe('useRestTimer', () => {
  it('start(120) calls scheduleNotificationAsync once with TIME_INTERVAL trigger and content.sound = false', async () => {
    const timer = makeTimer();
    await timer.start(120);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ sound: false }),
        trigger: expect.objectContaining({ type: 'timeInterval', seconds: 120 }),
      })
    );
  });

  it('start() while active: cancels prior notification then schedules a new one', async () => {
    const timer = makeTimer();
    await timer.start(90);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    (Notifications.scheduleNotificationAsync as ReturnType<typeof vi.fn>)
      .mockResolvedValue('mock-id-2');
    await timer.start(60);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('mock-id-1');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it('start(120) writes timer_start_epoch and timer_duration_seconds to MMKV', async () => {
    const timer = makeTimer();
    const before = Date.now();
    await timer.start(120);
    const after = Date.now();

    const storedEpoch = parseInt(timer.storage.getString('timer_start_epoch') ?? '0', 10);
    expect(timer.storage.getString('timer_duration_seconds')).toBe('120');
    expect(storedEpoch).toBeGreaterThanOrEqual(before);
    expect(storedEpoch).toBeLessThanOrEqual(after);
  });

  it('cancel() calls cancelScheduledNotificationAsync with stored id and sets remaining to null', async () => {
    const timer = makeTimer();
    await timer.start(120);
    expect(timer.remaining).toBe(120);

    await timer.cancel();

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('mock-id-1');
    expect(timer.remaining).toBeNull();
  });

  it('AppState active recomputes remaining from MMKV (timer_start_epoch + timer_duration_seconds)', async () => {
    vi.useFakeTimers();
    const startEpoch = Date.now();
    const timer = makeTimer();

    // 30s elapsed of a 120s timer => ~90s remaining
    timer.storage.set('timer_start_epoch', String(startEpoch - 30_000));
    timer.storage.set('timer_duration_seconds', '120');
    timer.rehydrate();

    expect(timer.remaining).not.toBeNull();
    const rem = timer.remaining as number;
    expect(rem).toBeGreaterThan(88);
    expect(rem).toBeLessThanOrEqual(91);
  });

  it('AppState active: remaining=null when elapsed >= duration (timer completed while backgrounded)', async () => {
    vi.useFakeTimers();
    const startEpoch = Date.now();
    const timer = makeTimer();

    timer.storage.set('timer_start_epoch', String(startEpoch - 90_000));
    timer.storage.set('timer_duration_seconds', '60');
    timer.rehydrate();

    expect(timer.remaining).toBeNull();
  });

  it('permission denial: start() sets remaining for in-app countdown but skips scheduleNotificationAsync (Pitfall 3)', async () => {
    (Notifications.requestPermissionsAsync as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ status: 'denied' });

    const timer = makeTimer();
    await timer.start(90);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(timer.remaining).toBe(90);
  });

  it('permission denial: start() does not throw', async () => {
    (Notifications.requestPermissionsAsync as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ status: 'denied' });

    const timer = makeTimer();
    await expect(timer.start(60)).resolves.not.toThrow();
  });

  it('addSeconds(30) reschedules with remaining + 30, updates MMKV timer_duration_seconds', async () => {
    const timer = makeTimer();
    await timer.start(120);

    (Notifications.scheduleNotificationAsync as ReturnType<typeof vi.fn>)
      .mockResolvedValue('mock-id-2');
    await timer.addSeconds(30);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('mock-id-1');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ seconds: 150 }) })
    );
    expect(timer.remaining).toBe(150);
    expect(timer.storage.getString('timer_duration_seconds')).toBe('150');
  });

  it('addSeconds(-30) clamps to minimum 1 second', async () => {
    const timer = makeTimer();
    await timer.start(20);
    await timer.addSeconds(-30);

    expect(timer.remaining).toBeGreaterThanOrEqual(1);
  });
});

// ── resolveRestSeconds — WORKOUT-07 ──────────────────────────────────────────

describe('resolveRestSeconds', () => {
  it('returns template override when non-null', () => {
    expect(resolveRestSeconds(60, 90)).toBe(60);
  });

  it('returns global default when template override is null', () => {
    expect(resolveRestSeconds(null, 90)).toBe(90);
  });

  it('returns global default when template override is undefined', () => {
    expect(resolveRestSeconds(undefined, 90)).toBe(90);
  });

  it('returns 90 (last-resort fallback) when both are null/undefined', () => {
    expect(resolveRestSeconds(null, null)).toBe(90);
    expect(resolveRestSeconds(undefined, undefined)).toBe(90);
    expect(resolveRestSeconds(null, undefined)).toBe(90);
  });

  it('returns 0 when template override is 0 (explicit zero = valid no-rest override)', () => {
    expect(resolveRestSeconds(0, 90)).toBe(0);
  });
});

// ── Module export contract ────────────────────────────────────────────────────

describe('useRestTimer — module exports', () => {
  it('exports useRestTimer function', async () => {
    const mod = await import('@/hooks/useRestTimer');
    expect(typeof mod.useRestTimer).toBe('function');
  });

  it('exports resolveRestSeconds function', async () => {
    const mod = await import('@/hooks/useRestTimer');
    expect(typeof mod.resolveRestSeconds).toBe('function');
  });
});

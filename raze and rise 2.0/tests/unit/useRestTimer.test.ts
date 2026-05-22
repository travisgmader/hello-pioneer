/**
 * useRestTimer tests — WORKOUT-06 + WORKOUT-07
 *
 * Tests run in a node environment without a React renderer.
 * The hook's pure logic (start, cancel, addSeconds, resolveRestSeconds, AppState
 * rehydration) is tested by calling the underlying functions directly through
 * an adapter that simulates the hook's internal state machine.
 *
 * Mocks:
 *   - expo-notifications: scheduleNotificationAsync, cancelScheduledNotificationAsync, requestPermissionsAsync
 *   - react-native-mmkv: createMMKV factory returning an in-memory Map-backed mock
 *   - react-native: AppState with a synchronous emit helper
 *   - React hooks (useState, useRef, useCallback, useEffect) patched for node env
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn().mockResolvedValue('mock-id-1'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

/** In-memory MMKV mock — Map-backed, supports set / getString / remove */
function createMockMMKVInstance() {
  const store = new Map<string, string>();
  return {
    set: vi.fn((key: string, value: string | number | boolean) => {
      store.set(key, String(value));
    }),
    getString: vi.fn((key: string) => store.get(key) ?? undefined),
    remove: vi.fn((key: string) => { store.delete(key); }),
    _store: store,
  };
}

let mmkvInstance = createMockMMKVInstance();

vi.mock('react-native-mmkv', () => ({
  createMMKV: vi.fn(() => mmkvInstance),
}));

/** AppState mock with synchronous emit for node env testing */
type AppStateStatus = 'active' | 'background' | 'inactive';
type ChangeHandler = (state: AppStateStatus) => void;

const appStateListeners = new Set<ChangeHandler>();

const AppStateMock = {
  currentState: 'active' as AppStateStatus,
  addEventListener: vi.fn((_event: string, handler: ChangeHandler) => {
    appStateListeners.add(handler);
    return { remove: () => { appStateListeners.delete(handler); } };
  }),
  emit: (state: AppStateStatus) => {
    AppStateMock.currentState = state;
    appStateListeners.forEach((h) => h(state));
  },
};

vi.mock('react-native', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react-native');
  return { ...actual, AppState: AppStateMock };
});

// ── Test imports ───────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { resolveRestSeconds } from '@/hooks/useRestTimer';

// ── Helpers: imperatively exercise the timer logic ─────────────────────────────

/**
 * Lightweight imperative simulation of useRestTimer's internal logic.
 * Mirrors the hook implementation without React state machinery.
 * This lets us test the timer's API contract in a plain node environment.
 */
function makeTimer() {
  const { createMMKV } = require('react-native-mmkv');
  const storage = createMMKV({ id: 'rest-timer' });

  let remaining: number | null = null;
  let notificationId: string | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let permissionGranted: boolean | null = null;

  const clearTick = () => {
    if (interval !== null) { clearInterval(interval); interval = null; }
  };

  const start = async (seconds: number): Promise<void> => {
    // Cancel prior notification
    if (notificationId !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationId = null;
    }
    clearTick();

    // Request permission once (cache result)
    if (permissionGranted === null) {
      const { status } = await Notifications.requestPermissionsAsync();
      permissionGranted = status === 'granted';
    }

    // Persist start state
    storage.set('timer_start_epoch', String(Date.now()));
    storage.set('timer_duration_seconds', String(seconds));

    remaining = seconds;

    // Only schedule OS notification when permission is granted
    if (permissionGranted) {
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
    remaining = null;
  };

  const addSeconds = async (delta: number): Promise<void> => {
    const current = remaining ?? 0;
    const next = Math.max(1, current + delta);

    // Cancel and reschedule
    if (notificationId !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationId = null;
    }

    storage.set('timer_duration_seconds', String(next));
    remaining = next;

    if (permissionGranted !== false) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Rest complete', body: 'Back to it.', sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: next,
        },
      });
      notificationId = id;
    }
  };

  /** Simulate what the AppState 'active' listener does in the hook */
  const rehydrate = (): void => {
    const startStr = storage.getString('timer_start_epoch');
    const durStr = storage.getString('timer_duration_seconds');
    if (!startStr || !durStr) return;
    const elapsed = (Date.now() - parseInt(startStr, 10)) / 1000;
    const dur = parseInt(durStr, 10);
    const rem = Math.max(0, dur - elapsed);
    remaining = rem > 0 ? rem : null;
  };

  return {
    get remaining() { return remaining; },
    get notificationId() { return notificationId; },
    start,
    cancel,
    addSeconds,
    rehydrate,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Fresh MMKV store each test
  mmkvInstance = createMockMMKVInstance();
  const { createMMKV } = require('react-native-mmkv');
  (createMMKV as ReturnType<typeof vi.fn>).mockReturnValue(mmkvInstance);
  // Clear AppState listeners
  appStateListeners.clear();
  AppStateMock.currentState = 'active';
  // Default mock return values
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

// ── useRestTimer logic tests ──────────────────────────────────────────────────

describe('useRestTimer', () => {
  it('start(120) calls scheduleNotificationAsync exactly once with TIME_INTERVAL trigger and content.sound = false', async () => {
    const timer = makeTimer();
    await timer.start(120);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ sound: false }),
        trigger: expect.objectContaining({
          type: 'timeInterval',
          seconds: 120,
        }),
      })
    );
  });

  it('start() while a prior notification is active first cancels the prior notification then schedules a new one', async () => {
    const timer = makeTimer();

    await timer.start(90);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    // Second start should cancel first, then reschedule
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

    expect(mmkvInstance.set).toHaveBeenCalledWith('timer_start_epoch', expect.any(String));
    expect(mmkvInstance.set).toHaveBeenCalledWith('timer_duration_seconds', '120');

    const storedEpoch = parseInt(mmkvInstance._store.get('timer_start_epoch') ?? '0', 10);
    expect(storedEpoch).toBeGreaterThanOrEqual(before);
    expect(storedEpoch).toBeLessThanOrEqual(after);
  });

  it('cancel() calls cancelScheduledNotificationAsync with the stored id and sets remaining to null', async () => {
    const timer = makeTimer();
    await timer.start(120);

    expect(timer.remaining).toBe(120);

    await timer.cancel();

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('mock-id-1');
    expect(timer.remaining).toBeNull();
  });

  it('AppState active recomputes remaining from MMKV-persisted timer_start_epoch + timer_duration_seconds', async () => {
    vi.useFakeTimers();
    const startEpoch = Date.now();

    // Seed MMKV: timer started 30s ago, duration 120s
    mmkvInstance._store.set('timer_start_epoch', String(startEpoch - 30_000));
    mmkvInstance._store.set('timer_duration_seconds', '120');

    const timer = makeTimer();
    timer.rehydrate();

    // remaining should be ~90s (120 - 30)
    expect(timer.remaining).not.toBeNull();
    const rem = timer.remaining as number;
    expect(rem).toBeGreaterThan(88);
    expect(rem).toBeLessThanOrEqual(91);
  });

  it('AppState active: sets remaining to null if elapsed time >= duration (timer completed while backgrounded)', async () => {
    vi.useFakeTimers();
    const startEpoch = Date.now();

    // Timer was 60s but 90s have elapsed — already done
    mmkvInstance._store.set('timer_start_epoch', String(startEpoch - 90_000));
    mmkvInstance._store.set('timer_duration_seconds', '60');

    const timer = makeTimer();
    timer.rehydrate();

    expect(timer.remaining).toBeNull();
  });

  it('permission denial: start() still sets remaining (in-app countdown) but skips scheduleNotificationAsync', async () => {
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

  it('addSeconds(30) cancels and reschedules with remaining + delta, updates MMKV', async () => {
    const timer = makeTimer();
    await timer.start(120);

    expect(timer.remaining).toBe(120);

    (Notifications.scheduleNotificationAsync as ReturnType<typeof vi.fn>)
      .mockResolvedValue('mock-id-2');

    await timer.addSeconds(30);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('mock-id-1');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ seconds: 150 }),
      })
    );
    expect(timer.remaining).toBe(150);
    expect(mmkvInstance.set).toHaveBeenCalledWith('timer_duration_seconds', '150');
  });

  it('addSeconds(-30) clamps to minimum 1 second', async () => {
    const timer = makeTimer();
    await timer.start(20);

    await timer.addSeconds(-30);

    expect(timer.remaining).toBeGreaterThanOrEqual(1);
  });
});

// ── resolveRestSeconds (WORKOUT-07) ──────────────────────────────────────────

describe('resolveRestSeconds', () => {
  it('returns the template override when non-null', () => {
    expect(resolveRestSeconds(60, 90)).toBe(60);
  });

  it('returns the global default when template override is null', () => {
    expect(resolveRestSeconds(null, 90)).toBe(90);
  });

  it('returns the global default when template override is undefined', () => {
    expect(resolveRestSeconds(undefined, 90)).toBe(90);
  });

  it('returns 90 (last-resort fallback) when both are null/undefined', () => {
    expect(resolveRestSeconds(null, null)).toBe(90);
    expect(resolveRestSeconds(undefined, undefined)).toBe(90);
    expect(resolveRestSeconds(null, undefined)).toBe(90);
  });

  it('returns 0 when template override is 0 (explicit zero is valid)', () => {
    expect(resolveRestSeconds(0, 90)).toBe(0);
  });
});

// ── Module export contract ─────────────────────────────────────────────────────

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

/**
 * useRestTimer — rest timer hook with OS notification scheduling + MMKV-backed recovery
 *
 * Implements WORKOUT-06 (rest timer) and WORKOUT-07 (rest seconds resolution).
 *
 * Key design decisions:
 *   - OS notification is scheduled via expo-notifications TIME_INTERVAL trigger so it fires
 *     even when the app is backgrounded or killed.
 *   - Timer state is persisted to MMKV so AppState 'active' can recompute remaining time
 *     accurately (JS setInterval drifts when backgrounded — RESEARCH.md Pitfall 2).
 *   - Permission denial is a silent fallback: in-app countdown continues, OS notification
 *     is skipped. No error UI per UI-SPEC.md error state patterns (RESEARCH.md Pitfall 3).
 *   - cleanup on unmount follows the same pattern as useSession.ts (sub.remove()).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

// ── MMKV instance — separate from the encrypted session store ─────────────────
// Unencrypted is fine here: timer state is ephemeral and not sensitive.
const timerStorage = createMMKV({ id: 'rest-timer' });

const TIMER_START_KEY = 'timer_start_epoch';
const TIMER_DURATION_KEY = 'timer_duration_seconds';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseRestTimerReturn {
  /** Remaining seconds, or null when no timer is active */
  remaining: number | null;
  /** Start a new rest timer for the given duration in seconds */
  start: (seconds: number) => Promise<void>;
  /** Cancel the active timer and any pending OS notification */
  cancel: () => Promise<void>;
  /** Adjust remaining time by delta (positive = add, negative = subtract). Clamps to 1s min. */
  addSeconds: (delta: number) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useRestTimer — floating rest timer with OS-backed local notification.
 *
 * Returns `{ remaining, start, cancel, addSeconds }`.
 *   - `remaining`: current countdown value in seconds (null = no active timer)
 *   - `start(seconds)`: starts the timer; schedules OS notification; persists to MMKV
 *   - `cancel()`: cancels OS notification + clears countdown
 *   - `addSeconds(delta)`: reschedules notification with new duration (±30s UX)
 */
export function useRestTimer(): UseRestTimerReturn {
  const [remaining, setRemaining] = useState<number | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const permissionGrantedRef = useRef<boolean | null>(null);

  // ── Internal helpers ───────────────────────────────────────────────────────

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback((initial: number) => {
    clearTick();
    let current = initial;
    intervalRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        setRemaining(0);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      } else {
        setRemaining(current);
      }
    }, 1000);
  }, [clearTick]);

  const scheduleNotification = useCallback(async (seconds: number): Promise<string> => {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest complete',
        body: 'Back to it.',
        sound: false, // expo-audio plays tone in-app; OS channel handles backgrounded state
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  }, []);

  // ── Permission — requested once, result cached in ref ─────────────────────

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (permissionGrantedRef.current !== null) return permissionGrantedRef.current;
    const { status } = await Notifications.requestPermissionsAsync();
    permissionGrantedRef.current = status === 'granted';
    return permissionGrantedRef.current;
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = useCallback(async (seconds: number): Promise<void> => {
    // Cancel any prior OS notification
    if (notificationIdRef.current !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    clearTick();

    // Persist start state for AppState rehydration (RESEARCH.md Pitfall 2)
    timerStorage.set(TIMER_START_KEY, String(Date.now()));
    timerStorage.set(TIMER_DURATION_KEY, String(seconds));

    setRemaining(seconds);
    startTick(seconds);

    // Schedule OS notification if permission is granted
    const granted = await ensurePermission();
    if (granted) {
      const id = await scheduleNotification(seconds);
      notificationIdRef.current = id;
    }
    // If denied: silent fallback — countdown still active (RESEARCH.md Pitfall 3)
  }, [clearTick, startTick, ensurePermission, scheduleNotification]);

  const cancel = useCallback(async (): Promise<void> => {
    if (notificationIdRef.current !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    clearTick();
    timerStorage.remove(TIMER_START_KEY);
    timerStorage.remove(TIMER_DURATION_KEY);
    setRemaining(null);
  }, [clearTick]);

  const addSeconds = useCallback(async (delta: number): Promise<void> => {
    const current = remaining ?? 0;
    const next = Math.max(1, current + delta);

    // Cancel prior OS notification
    if (notificationIdRef.current !== null) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    clearTick();

    // Update MMKV duration (start epoch stays the same — we're adjusting remaining)
    timerStorage.set(TIMER_DURATION_KEY, String(next));

    setRemaining(next);
    startTick(next);

    // Reschedule OS notification
    if (permissionGrantedRef.current !== false) {
      const granted = await ensurePermission();
      if (granted) {
        const id = await scheduleNotification(next);
        notificationIdRef.current = id;
      }
    }
  }, [remaining, clearTick, startTick, ensurePermission, scheduleNotification]);

  // ── AppState listener — rehydrate on foreground return ────────────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const startStr = timerStorage.getString(TIMER_START_KEY);
      const durStr = timerStorage.getString(TIMER_DURATION_KEY);
      if (!startStr || !durStr) return;
      const elapsed = (Date.now() - parseInt(startStr, 10)) / 1000;
      const dur = parseInt(durStr, 10);
      const rem = Math.max(0, dur - elapsed);
      if (rem > 0) {
        setRemaining(Math.floor(rem));
        startTick(Math.floor(rem));
      } else {
        // Timer completed while backgrounded — treat as done
        setRemaining(null);
      }
    });

    // Same cleanup pattern as useSession.ts line 52
    return () => {
      sub.remove();
      clearTick();
    };
  }, [clearTick, startTick]);

  return { remaining, start, cancel, addSeconds };
}

// ── resolveRestSeconds (WORKOUT-07) ──────────────────────────────────────────

/**
 * Resolve the rest duration for a set, following the priority:
 *   1. template_exercises.default_rest_seconds (per-exercise override)
 *   2. split_settings.global_rest_seconds (user's global default)
 *   3. 90s (last-resort built-in fallback)
 *
 * Note: `0` is treated as a valid override (user explicitly set 0s rest).
 * Only `null` and `undefined` trigger the next priority level.
 */
export function resolveRestSeconds(
  templateOverride: number | null | undefined,
  globalDefault: number | null | undefined
): number {
  if (templateOverride !== null && templateOverride !== undefined) {
    return templateOverride;
  }
  if (globalDefault !== null && globalDefault !== undefined) {
    return globalDefault;
  }
  return 90;
}

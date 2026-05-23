/**
 * healthkit.ts — Apple Health integration stub for Phase 2.
 *
 * Phase 2 scope: wrapper-only — returns null on Android and on iOS where
 * react-native-health is not yet integrated. This stub exists so that
 * RunExerciseRow can call readLastRunDistance() without crashing.
 *
 * Phase 5 (WEARABLE-01) will replace the null return with a real
 * react-native-health HealthKit query.
 *
 * The Settings `useDeviceGpsForRun` toggle persists user preference even
 * though the device GPS fallback is deferred (CONTEXT.md Deferred Ideas).
 *
 * Security: T-02-17 — HealthKit read on non-iOS returns null.
 * Stub is explicit + documented. Null return is a no-op at the call site.
 * No HealthKit permission is requested in Phase 2.
 */

import { Platform } from 'react-native';

export interface RunSample {
  /** Run distance in meters */
  distanceMeters: number;
  /** Run duration in seconds */
  durationSeconds: number;
  /** ISO string — when the run ended */
  endedAt: string;
}

/**
 * readLastRunDistance — read the most recent run from Apple Health.
 *
 * Phase 2: always returns null (stub).
 *   - On Android: Platform.OS !== 'ios' → returns null immediately.
 *   - On iOS: react-native-health is not integrated in Phase 2 → returns null.
 *
 * Phase 5 (WEARABLE-01) will replace this with:
 *   - Import from 'react-native-health'
 *   - Request HealthKit permissions (HKQuantityTypeIdentifierDistanceWalkingRunning, HKQuantityTypeIdentifierAppleExerciseTime)
 *   - Query HKWorkoutType for the most recent workout
 *   - Return RunSample with actual distance + duration
 *
 * The caller (RunExerciseRow) treats null as a silent no-op — no error UI is shown
 * per UI-SPEC.md error pattern for background reads (WORKOUT-13).
 */
export async function readLastRunDistance(): Promise<RunSample | null> {
  if (Platform.OS !== 'ios') {
    // Not iOS — HealthKit unavailable
    return null;
  }

  // Phase 5 will replace this with a react-native-health call.
  // For now, return null (stub).
  return null;
}

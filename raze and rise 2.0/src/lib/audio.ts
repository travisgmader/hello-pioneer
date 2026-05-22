/**
 * audio.ts — Rest timer audio helper
 *
 * expo-audio is hook-based. The `useAudioPlayer` hook MUST be called inside
 * a React component or hook — it cannot be called at module top-level.
 *
 * Pattern:
 *   - `initAudioMode()` — idempotent async function; configures AVAudioSession
 *     once so the timer tone respects silent mode and does not interrupt other audio.
 *   - `useTimerCompletePlayer()` — React hook returning { play: () => void }.
 *     Internally wraps `useAudioPlayer` with the timer-complete WAV asset.
 *     Callers (RestTimerPill) consume this hook and call `play()` at timer zero.
 *
 * Error contract:
 *   - `setAudioModeAsync` failures are caught and logged — audio mode set failure
 *     is non-blocking (timer still works without sound per UI-SPEC.md error pattern).
 */

import { useCallback } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

/** Guard so `initAudioMode` only configures audio mode once per app session. */
let audioModeInitialized = false;

/**
 * Configure AVAudioSession / Android AudioManager for the rest timer tone.
 * Call once at session screen mount (before the first rest timer could fire).
 *
 * Settings:
 *   - `shouldPlayInBackground: false`  — the OS notification handles sound when
 *     the app is backgrounded; no background audio session needed for a ~300ms tone
 *   - `playsInSilentMode: false`       — respect the hardware silent switch;
 *     haptics cover the silent case
 *   - `interruptionMode: 'mixWithOthers'` — do not pause music/podcasts for a
 *     short timer beep
 *
 * Idempotent: subsequent calls are no-ops.
 */
export async function initAudioMode(): Promise<void> {
  if (audioModeInitialized) return;
  try {
    await setAudioModeAsync({
      shouldPlayInBackground: false,
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    });
    audioModeInitialized = true;
  } catch (err) {
    // Non-blocking: timer still works without audio mode configuration.
    // Failure here is typically an AVAudioSession conflict (e.g., simulator).
    // eslint-disable-next-line no-console
    console.warn('[audio] setAudioModeAsync failed (non-blocking):', err);
  }
}

/**
 * React hook that exposes an imperative `play()` callback for the timer-complete
 * tone. Wraps `useAudioPlayer` (expo-audio hook) with the WAV asset.
 *
 * Usage inside a component:
 *   ```tsx
 *   const { play } = useTimerCompletePlayer();
 *   // At timer zero:
 *   play();
 *   ```
 *
 * The hook:
 *   1. Instantiates a single AudioPlayer for `assets/sounds/timer-complete.wav`
 *   2. Returns a stable `play` callback that seeks to 0 and plays, allowing
 *      re-triggering the tone if the timer is restarted mid-session
 *
 * @returns `{ play: () => void }` — call `play()` when the rest timer hits zero
 */
export function useTimerCompletePlayer(): { play: () => void } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const player = useAudioPlayer(require('../../assets/sounds/timer-complete.wav'));

  const play = useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch (err) {
      // Non-blocking: if audio playback fails, haptics + notification still notify the user.
      // eslint-disable-next-line no-console
      console.warn('[audio] playTimerComplete failed (non-blocking):', err);
    }
  }, [player]);

  return { play };
}

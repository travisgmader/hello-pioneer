/**
 * AnubisOverlay — full-screen Lottie completion overlay (DESIGN-03, D-11, D-12).
 *
 * Renders as a full-screen overlay on top of the SessionScreen when visible.
 * The Anubis animation plays once (no loop) while the PowerSync writeTransaction
 * commits session data in the background — Lottie provides the visual cover.
 *
 * Motion sequence (UI-SPEC.md Motion — Anubis sequence):
 *   1. Parent sets visible=true → overlay fades in over 600ms (anubis-fade)
 *   2. LottieView plays once (autoPlay, loop=false)
 *   3. onAnimationFinish → overlay fades out over 600ms (anubis-fade)
 *   4. After fade-out completes → onFadeOutComplete() fires → caller navigates
 *
 * Reduce motion (UI-SPEC.md Accessibility — Reduce Motion):
 *   - When useReducedMotion() is true, Lottie does not animate
 *   - Static first frame is held for 600ms via setTimeout
 *   - onFadeOutComplete() fires immediately after the hold
 *
 * Accessibility (UI-SPEC.md VoiceOver):
 *   - accessibilityRole="image" (overlay is a visual decoration, not interactive)
 *   - accessibilityLabel="Workout complete"
 *   - pointerEvents="auto" — blocks taps during playback (not dismissible)
 *
 * Background color: #0A0A0B (bg token hex) — required for Animated.View inline style.
 * This is a documented Phase 2 exception for animated overlays (UI-SPEC.md §Token export
 * pattern). Same exception as ActivityIndicator color and placeholderTextColor in Phase 1.
 *
 * Asset: assets/animations/anubis.json — local require(), never a URL (registry safety,
 * offline-first). Plan 01 Task 4 audited the file for Lottie expressions field (none found).
 *
 * pointerEvents prop: 'auto' blocks all touches during playback per UI-SPEC.md
 * "NOT dismissible — plays through to completion".
 */

import React, { useCallback, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnubisOverlayProps {
  /**
   * When true, the overlay fades in and the Lottie animation plays.
   * When false (or before first show), the overlay is not rendered.
   */
  visible: boolean;
  /**
   * Called after the fade-out animation completes.
   * The parent (SessionScreen) should navigate to Dashboard in this callback.
   */
  onFadeOutComplete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AnubisOverlay({ visible, onFadeOutComplete }: AnubisOverlayProps) {
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const lottieRef = useRef<LottieView>(null);
  // Track whether we've already handled the completion (prevents double-fire
  // from both onAnimationFinish and setTimeout in reduced-motion path)
  const completedRef = useRef(false);

  // ── handleLottieDone — fires when Lottie finishes (or reduced-motion timeout) ──
  const handleLottieDone = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (reducedMotion) {
      // No animation — immediately fire completion callback
      // Opacity was set to 1 directly; no fade-out animation
      opacity.value = 0;
      onFadeOutComplete();
    } else {
      // Fade out over 600ms, then fire completion callback on the JS thread
      opacity.value = withTiming(0, { duration: 600 }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onFadeOutComplete)();
        }
      });
    }
  }, [reducedMotion, opacity, onFadeOutComplete]);

  // ── Fade in + reduced-motion fallback ────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      // Reset for potential re-use
      completedRef.current = false;
      opacity.value = 0;
      return;
    }

    if (reducedMotion) {
      // Skip animation — snap to visible, hold first Lottie frame for 600ms
      opacity.value = 1;
      const t = setTimeout(() => {
        handleLottieDone();
      }, 600);
      return () => clearTimeout(t);
    } else {
      // Fade in over 600ms (anubis-fade token)
      opacity.value = withTiming(1, { duration: 600 });
    }
  }, [visible, reducedMotion, opacity, handleLottieDone]);

  // ── Animated style ────────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Do not render when not visible (avoids invisible overlay blocking touches)
  if (!visible) return null;

  return (
    <Animated.View
      // pointerEvents="auto" — blocks all touches during Anubis playback
      // (overlay is NOT dismissible; plays through to completion per UI-SPEC.md)
      pointerEvents="auto"
      accessibilityRole="image"
      accessibilityLabel="Workout complete"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // #0A0A0B = bg token hex (Phase 2 declared exception for Animated.View style)
          backgroundColor: '#0A0A0B',
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      {/* LottieView: local asset, plays once, no loop (DESIGN-03, D-12) */}
      {/* autoPlay gated by !reducedMotion — static first frame when reduced motion is on */}
      {/* onAnimationFinish triggers the fade-out → navigation sequence */}
      <LottieView
        ref={lottieRef}
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../../assets/animations/anubis.json')}
        autoPlay={!reducedMotion}
        loop={false}
        style={{ width: '60%', height: '60%' }}
        onAnimationFinish={handleLottieDone}
      />
    </Animated.View>
  );
}

export default AnubisOverlay;

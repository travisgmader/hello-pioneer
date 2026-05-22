/**
 * RestTimerPill — floating bottom pill with rest timer countdown + controls.
 *
 * Three visual states (UI-SPEC.md RestTimerPill section):
 *   State 3 — Hidden:  remaining === null  → returns null (unmounted, no placeholder)
 *   State 1 — Active:  remaining > 0       → countdown in M:SS, drain bar, ±30s + Skip
 *   State 2 — Zero:    remaining === 0     → accent bg flash, "0:00" + "Rest complete" body,
 *                                            haptic + audio + auto-dismiss after 3s (parent responsibility)
 *
 * Layout: absolute, bottom: safeAreaBottom + 16pt, horizontal margin 16pt, 64pt height.
 *
 * Animated progress bar: 2px tall, drains linearly over the rest duration using
 * `withTiming(target, { duration: 1000, easing: Easing.linear })` per UI-SPEC.md timer-tick.
 *
 * Zero-state side effects (fire ONCE per zero transition via hasZeroFiredRef):
 *   - Haptics.notificationAsync(Success)
 *   - play() from useTimerCompletePlayer()
 *
 * Styling notes (PATTERNS.md + STATE.md rules):
 *   - NativeWind className for all static tokens
 *   - Dynamic colors (zero-state bg #F2CA50, shadow) via style prop with hex (cannot use
 *     NativeWind dynamic className per STATE.md convention)
 *   - fontVariant: ['tabular-nums'] via NumericText component (no NativeWind utility)
 *   - allowFontScaling={false} on all Text per Phase 2 policy
 */

import React, { useEffect, useRef } from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MinusCircle, PlusCircle } from 'lucide-react-native';

import { NumericText } from '@/components/NumericText';
import { IconButton } from '@/components/IconButton';
import { useTimerCompletePlayer } from '@/lib/audio';

// ── Timer design tokens (hex per STATE.md rule — dynamic colors cannot use NativeWind) ──
const ACCENT_HEX = '#F2CA50';
const TIMER_ZERO_FG = '#0A0A0B';

// ── Props ─────────────────────────────────────────────────────────────────────

interface RestTimerPillProps {
  /** null = hidden (unmounted), 0 = zero state, >0 = active countdown */
  remaining: number | null;
  /** Original duration in seconds — used to compute progress bar percentage */
  totalSeconds: number;
  /** Called when user taps Skip */
  onSkip: () => void;
  /** Called when user taps ±30s buttons; pass +30 or -30 */
  onAddSeconds: (delta: number) => void;
}

// ── Format helper ─────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * RestTimerPill — floating rest timer overlay.
 *
 * Mount/unmount is controlled by the parent: pass `remaining={null}` to hide.
 * Pass `remaining={0}` to show the zero state (parent should auto-dismiss after 3s).
 */
export function RestTimerPill({
  remaining,
  totalSeconds,
  onSkip,
  onAddSeconds,
}: RestTimerPillProps) {
  // ── Audio ──────────────────────────────────────────────────────────────────
  const { play } = useTimerCompletePlayer();

  // ── Zero-state fire-once guard ─────────────────────────────────────────────
  // Prevents haptic + audio from re-firing on subsequent re-renders at zero.
  const hasZeroFiredRef = useRef(false);

  // ── Reduced motion ─────────────────────────────────────────────────────────
  const reducedMotion = useReducedMotion();

  // ── Progress bar animation ─────────────────────────────────────────────────
  const widthPercent = useSharedValue(100); // starts full, drains to 0

  useEffect(() => {
    if (remaining === null) {
      // Hidden — reset for next timer
      hasZeroFiredRef.current = false;
      widthPercent.value = 100;
      return;
    }
    const effectiveTotalSeconds = totalSeconds > 0 ? totalSeconds : 1;
    const target = Math.min(Math.max((remaining / effectiveTotalSeconds) * 100, 0), 100);
    if (reducedMotion) {
      widthPercent.value = target;
    } else {
      widthPercent.value = withTiming(target, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [remaining, totalSeconds, reducedMotion]);

  const drainStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value}%`,
  }));

  // ── Zero-state side effects (fire ONCE per transition) ─────────────────────
  useEffect(() => {
    if (remaining === 0 && !hasZeroFiredRef.current) {
      hasZeroFiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        // Non-blocking: haptics unavailable in simulator or denied
      });
      play();
    }
  }, [remaining, play]);

  // ── Safe area insets ───────────────────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + 16;

  // ── Render ─────────────────────────────────────────────────────────────────

  // State 3: Hidden — unmounted, no placeholder
  if (remaining === null) return null;

  const isZero = remaining === 0;

  // State 2: Zero — accent bg flash
  if (isZero) {
    return (
      <View
        accessibilityRole="timer"
        accessibilityLiveRegion="polite"
        style={{
          position: 'absolute',
          bottom: bottomOffset,
          left: 16,
          right: 16,
        }}
      >
        <View
          style={{
            height: 64,
            borderRadius: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ACCENT_HEX,
            shadowColor: ACCENT_HEX,
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <NumericText
            className="text-numeric-large font-bold"
            style={{ color: TIMER_ZERO_FG }}
            allowFontScaling={false}
          >
            0:00
          </NumericText>
          <Text
            className="text-body font-bold"
            style={{ color: TIMER_ZERO_FG }}
            allowFontScaling={false}
          >
            Rest complete
          </Text>
        </View>
      </View>
    );
  }

  // State 1: Active countdown
  return (
    <View
      accessibilityRole="timer"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 16,
        right: 16,
      }}
    >
      <View
        className="h-16 rounded-lg bg-bg-elevated border border-border-strong overflow-hidden"
        style={{
          shadowColor: ACCENT_HEX,
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {/* Controls row */}
        <View className="flex-1 flex-row items-center justify-between px-md">
          {/* Minus 30s */}
          <IconButton
            icon={<MinusCircle size={20} color="#E5E2E1" />}
            onPress={() => onAddSeconds(-30)}
            accessibilityLabel="Remove 30 seconds"
          />

          {/* Countdown */}
          <NumericText
            className="text-numeric-large font-bold text-fg"
            allowFontScaling={false}
          >
            {formatTime(remaining)}
          </NumericText>

          {/* Plus 30s */}
          <IconButton
            icon={<PlusCircle size={20} color="#E5E2E1" />}
            onPress={() => onAddSeconds(30)}
            accessibilityLabel="Add 30 seconds"
          />

          {/* Skip */}
          <Pressable
            className="min-w-[44px] h-11 items-center justify-center px-sm active:opacity-80"
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip rest timer"
          >
            <Text className="text-body text-fg-muted" allowFontScaling={false}>
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Progress drain bar — 2px at bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: 'rgba(212, 175, 55, 0.22)', // border token
          }}
        >
          <Animated.View
            style={[
              {
                height: 2,
                backgroundColor: ACCENT_HEX,
              },
              drainStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default RestTimerPill;

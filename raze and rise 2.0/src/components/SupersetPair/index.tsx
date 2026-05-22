/**
 * SupersetPair — visual bracket wrapper for two paired exercises in a superset.
 *
 * Per UI-SPEC.md Component Inventory:
 *   "Two ExerciseCards rendered together with a 2px accent vertical line connecting
 *   their left edges + a small 'SUPERSET' caption label between them (12px in fg-muted,
 *   uppercase, letter-spaced)"
 *
 * Implementation:
 *   A 2px accent colored vertical line + 'SUPERSET' text label are placed in a row
 *   between the two ExerciseCards. This is visually equivalent to the spec bracket
 *   and avoids complex absolute positioning inside a FlashList item (which would
 *   break recycling).
 *
 * No state — pure composition. Interactivity delegated entirely to ExerciseCard children.
 * FlashList recycling safe: no useState, no useEffect.
 *
 * Props:
 *   exerciseA/exerciseB — ExerciseState for each arm
 *   activeArm          — 'A' | 'B' | null — drives isActive on the correct card
 *   All other props passed through to ExerciseCard (sessionId, unit, etc.)
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text } from 'react-native';

import { ExerciseState } from '@/stores/sessionStore';
import { ExerciseCard } from '@/components/ExerciseCard';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SupersetPairProps {
  exerciseA: ExerciseState;
  exerciseB: ExerciseState;
  sessionId: string;
  /** Authenticated user ID — passed through to ExerciseCard for bodyweight hook (WORKOUT-12) */
  userId: string;
  unit: 'lbs' | 'kg';
  globalRestSeconds: number;
  /** Which arm is currently "active" (first with unlogged sets). null = neither. */
  activeArm: 'A' | 'B' | null;
  /** Called when user taps Shuffle on exercise A */
  onSwapA: () => void;
  /** Called when user taps Shuffle on exercise B */
  onSwapB: () => void;
  /** Called when a set's expand chevron is tapped */
  onExpandSet: (setId: string) => void;
}

// ── Accent color constant ─────────────────────────────────────────────────────
// Using inline style (not className) because the 2px accent bar needs a hex color.
// NativeWind cannot render an arbitrary hex as backgroundColor on a native View.
// This follows the established exception documented in STATE.md.
const ACCENT_COLOR = '#F2CA50';

// ── Component ─────────────────────────────────────────────────────────────────

export function SupersetPair({
  exerciseA,
  exerciseB,
  sessionId,
  userId,
  unit,
  globalRestSeconds,
  activeArm,
  onSwapA,
  onSwapB,
  onExpandSet,
}: SupersetPairProps) {
  return (
    <View>
      {/* Exercise A */}
      <ExerciseCard
        exercise={exerciseA}
        sessionId={sessionId}
        userId={userId}
        unit={unit}
        globalRestSeconds={globalRestSeconds}
        isActive={activeArm === 'A'}
        onSwap={onSwapA}
        onExpandSet={onExpandSet}
      />

      {/* Bracket divider: 2px accent vertical line + SUPERSET caption */}
      <View className="flex-row items-center gap-sm py-xs">
        {/* 2px accent vertical line — the visual "bracket" connecting the two cards */}
        <View
          style={{ width: 2, height: 24, backgroundColor: ACCENT_COLOR }}
        />
        <Text
          className="text-caption text-fg-muted"
          allowFontScaling={false}
          style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}
        >
          SUPERSET
        </Text>
      </View>

      {/* Exercise B */}
      <ExerciseCard
        exercise={exerciseB}
        sessionId={sessionId}
        userId={userId}
        unit={unit}
        globalRestSeconds={globalRestSeconds}
        isActive={activeArm === 'B'}
        onSwap={onSwapB}
        onExpandSet={onExpandSet}
      />
    </View>
  );
}

export default SupersetPair;

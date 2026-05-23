/**
 * RunExerciseRow — distance/time display for run exercise type (WORKOUT-13).
 *
 * Replaces WeightInput in SetRow when exerciseType === 'run'.
 *
 * Layout:
 *   If no data: muted placeholder "Tap to pull from Apple Health"
 *   If data:    [distance km]  [duration M:SS]  [Pull from Apple Health button]
 *
 * The "Pull from Apple Health" button calls onPullFromHealth which is wired to
 * readLastRunDistance() in SetRow. In Phase 2, this returns null silently (stub).
 * In Phase 5, it returns real HealthKit data.
 *
 * Distance unit: km (Phase 2 default; unit conversion lands in Phase 6).
 * Duration format: M:SS for < 1 hour, H:MM:SS for ≥ 1 hour.
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Activity } from 'lucide-react-native';

import { NumericText } from '@/components/NumericText';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RunExerciseRowProps {
  setId: string;
  /** Distance in meters — null if not yet recorded */
  distanceMeters: number | null;
  /** Duration in seconds — null if not yet recorded */
  durationSeconds: number | null;
  /** Async callback — triggers Apple Health pull (silently no-ops if data unavailable) */
  onPullFromHealth: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDistanceKm(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RunExerciseRow({
  setId,
  distanceMeters,
  durationSeconds,
  onPullFromHealth,
}: RunExerciseRowProps) {
  const hasData = distanceMeters !== null && durationSeconds !== null;

  return (
    <View className="flex-row items-center gap-sm flex-1">
      {hasData ? (
        <>
          {/* Distance display */}
          <NumericText
            className="text-caption text-fg"
            allowFontScaling={false}
          >
            {formatDistanceKm(distanceMeters!)}
          </NumericText>

          {/* Duration display */}
          <NumericText
            className="text-caption text-fg-muted"
            allowFontScaling={false}
          >
            {formatDuration(durationSeconds!)}
          </NumericText>

          {/* Pull from Health button — ghost-style inline */}
          <Pressable
            className="flex-row items-center gap-xs active:opacity-60"
            onPress={onPullFromHealth}
            accessibilityRole="button"
            accessibilityLabel="Pull from Apple Health"
          >
            <Activity size={16} color="#99907C" />
            <Text
              className="text-caption text-fg-muted"
              allowFontScaling={false}
            >
              Pull
            </Text>
          </Pressable>
        </>
      ) : (
        /* No data yet — placeholder CTA */
        <Pressable
          className="flex-row items-center gap-xs active:opacity-60"
          onPress={onPullFromHealth}
          accessibilityRole="button"
          accessibilityLabel="Tap to pull from Apple Health"
        >
          <Activity size={16} color="#99907C" />
          <Text
            className="text-caption text-fg-muted"
            allowFontScaling={false}
          >
            Tap to pull from Apple Health
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default RunExerciseRow;

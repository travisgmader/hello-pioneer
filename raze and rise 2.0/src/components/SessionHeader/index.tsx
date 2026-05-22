/**
 * SessionHeader — day label + elapsed timer + Complete Workout button + Session Note button.
 *
 * Positioned OUTSIDE the FlashList so the elapsed timer's useState tick
 * every 1 second does NOT re-render the list (RESEARCH.md Code Examples —
 * "Elapsed Timer Without State Re-renders" alternative note).
 *
 * Layout: horizontal flex, items-center, justify-between, 56pt height.
 * - Left: day label (Noto Serif 24px/700 per UI-SPEC.md heading style)
 * - Center: elapsed timer (NumericText tabular-nums, M:SS or H:MM:SS)
 * - Right: Complete button (36pt height, 88pt min-width per UI-SPEC.md exception)
 *
 * Below the header row (Plan 08 — WORKOUT-09):
 * - StickyNote IconButton (20px lucide) opens the session-level note sheet
 *   per UI-SPEC.md "positioned just below the day label"
 *
 * Elapsed timer format:
 *   < 1 hour: M:SS   (e.g. 4:32)
 *   ≥ 1 hour: H:MM:SS (e.g. 1:04:32)
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StickyNote } from 'lucide-react-native';
import { NumericText } from '@/components/NumericText';
import { IconButton } from '@/components/IconButton';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SessionHeaderProps {
  /** Day label from the template (e.g. "Push", "Pull", "Legs") */
  dayLabel: string;
  /** ISO string of when the session started — used to compute elapsed time */
  startedAt: string;
  /** Called when user taps "Complete" */
  onComplete: () => void;
  /** Called when user taps the StickyNote icon to open the session note sheet (Plan 08) */
  onOpenNote?: () => void;
  /** Optional: open the body map screen (Plan 06) */
  onOpenBodyMap?: () => void;
}

// ── Elapsed timer helper ──────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionHeader({
  dayLabel,
  startedAt,
  onComplete,
  onOpenNote,
}: SessionHeaderProps) {
  // Elapsed timer — safe to use useState here since SessionHeader is NOT inside FlashList
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const startMs = new Date(startedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const startMs = new Date(startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <View className="px-md pt-sm pb-xs">
      {/* Main header row */}
      <View className="flex-row items-center justify-between" style={{ minHeight: 56 }}>
        {/* Day label — Noto Serif 24/700 per UI-SPEC.md heading style */}
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'NotoSerif_700Bold', fontSize: 24, lineHeight: 30, color: '#E5E2E1' }}
        >
          {dayLabel}
        </Text>

        {/* Elapsed timer — NumericText, tabular-nums, 20px per UI-SPEC.md */}
        <NumericText
          style={{ fontSize: 20, lineHeight: 24, fontWeight: '700', color: '#E5E2E1' }}
          allowFontScaling={false}
        >
          {formatElapsed(elapsedSeconds)}
        </NumericText>

        {/* Complete button — 36pt height × 88pt min-width (UI-SPEC.md exception) */}
        <Pressable
          className="bg-accent rounded-md items-center justify-center active:opacity-80"
          style={{ height: 36, minWidth: 88, paddingHorizontal: 12 }}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Complete workout"
        >
          <Text
            className="text-bg text-body font-bold"
            allowFontScaling={false}
          >
            Complete
          </Text>
        </Pressable>
      </View>

      {/* Session note button — positioned just below the day label (UI-SPEC.md, Plan 08 — WORKOUT-09) */}
      {onOpenNote && (
        <View className="flex-row">
          <IconButton
            icon={<StickyNote size={20} color="#99907C" />}
            onPress={onOpenNote}
            accessibilityLabel="Add session note"
          />
        </View>
      )}
    </View>
  );
}

export default SessionHeader;

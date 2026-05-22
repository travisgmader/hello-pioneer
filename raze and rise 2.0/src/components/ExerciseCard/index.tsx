/**
 * ExerciseCard — exercise card with N SetRows + Add set button.
 *
 * Renders as a FlashList item (plain View — NOT nested FlashList per RESEARCH.md Pitfall 6).
 * At most 5–7 sets per exercise — no virtualization needed for set rows.
 *
 * Visual variants:
 *   isActive=true:  bg-accent-dim + border-border-strong + 2px accent LeftEdgeBar on card
 *   isActive=false: bg-bg-elevated + border-border (standard elevated card)
 *
 * Header row: exercise name + set count caption + Shuffle icon (Plan 08 wires swap)
 * Body: array of SetRow components as plain View children
 * Footer: AddSetButton (appends a new set to the exercise in Zustand)
 * Stub: progressive overload hint placeholder View (Plan 08 fills it)
 *
 * Per RESEARCH.md Pitfall 1: ExerciseCard MUST NOT use local useState for any
 * cross-render state. isActive is computed from props (safe — changes on re-render).
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Shuffle } from 'lucide-react-native';

import { ExerciseState } from '@/stores/sessionStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePreviousPerformance } from '@/hooks/useSessionData';

import { LeftEdgeBar } from '@/components/LeftEdgeBar';
import { IconButton } from '@/components/IconButton';
import { SetRow } from '@/components/SetRow';
import { AddSetButton } from '@/components/AddSetButton';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseState;
  sessionId: string;
  unit: 'lbs' | 'kg';
  globalRestSeconds: number;
  /** True when this exercise is the next one to log (first with unlogged sets) */
  isActive: boolean;
  /** Called when user taps Shuffle to swap the exercise (Plan 08 wires the modal) */
  onSwap: () => void;
  /** Called when a set's expand chevron is tapped */
  onExpandSet: (setId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExerciseCard({
  exercise,
  sessionId,
  unit,
  globalRestSeconds,
  isActive,
  onSwap,
  onExpandSet,
}: ExerciseCardProps) {
  // Get expandedSetId from store to pass to SetRow
  const expandedSetId = useSessionStore((s) => s.expandedSetId);

  // Previous performance — loaded from PowerSync for the exercise
  const prevPerformanceRows = usePreviousPerformance(exercise.exerciseId, sessionId);

  // Build a map: set_number → { weightKg, results[] } for previous performance
  // We group by the most recent session's sets (first 10 rows sorted by DESC completed_at)
  const prevPerformanceBySetNumber = React.useMemo(() => {
    const map = new Map<number, { weightKg: number | null; results: ('go' | 'no-go' | null)[] }>();

    // Group all rows by set_number, accumulate results
    for (const row of prevPerformanceRows) {
      const existing = map.get(row.set_number);
      const result = (row.result as 'go' | 'no-go' | null) ?? null;
      if (existing) {
        existing.results.push(result);
      } else {
        map.set(row.set_number, {
          weightKg: row.weight_kg,
          results: [result],
        });
      }
    }

    return map;
  }, [prevPerformanceRows]);

  // Set count label: "5 sets" / "1 set"
  const setCountLabel = `${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}`;
  const repRangeLabel = `${exercise.repLow}–${exercise.repHigh} reps`;

  // Card shell classes — active variant has accent-dim bg + border-strong
  // Base: bg-bg-elevated rounded-lg p-md border border-border gap-sm (plan spec)
  const cardClass = isActive
    ? 'bg-accent-dim rounded-lg p-md border border-border-strong gap-sm'
    : 'bg-bg-elevated rounded-lg p-md border border-border gap-sm';

  return (
    <View className={cardClass}>
      {/* Active state: 2px accent LeftEdgeBar on the left edge of the card */}
      {isActive && (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}>
          <LeftEdgeBar variant="accent" />
        </View>
      )}

      {/* Header row: exercise name + set count + Shuffle button */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className={isActive ? 'text-body font-bold text-fg' : 'text-body text-fg'}
            allowFontScaling={false}
          >
            {exercise.exerciseName}
          </Text>
          <Text className="text-caption text-fg-muted" allowFontScaling={false}>
            {setCountLabel} · {repRangeLabel}
          </Text>
        </View>

        {/* Shuffle icon — Plan 08 wires exercise swap modal */}
        <IconButton
          icon={<Shuffle size={20} color="#99907C" />}
          onPress={onSwap}
          accessibilityLabel="Swap exercise"
        />
      </View>

      {/* Set rows — plain View children (NOT nested FlashList per Pitfall 6) */}
      {exercise.sets.map((set, index) => {
        const prevPerf = prevPerformanceBySetNumber.get(set.setNumber) ?? {
          weightKg: null,
          results: [],
        };

        return (
          <SetRow
            key={set.id}
            setId={set.id}
            setNumber={set.setNumber}
            exerciseId={exercise.exerciseId}
            exerciseName={exercise.exerciseName}
            sessionId={sessionId}
            repsTarget={`${exercise.repLow}-${exercise.repHigh}`}
            unit={unit}
            defaultRestSeconds={exercise.defaultRestSeconds}
            globalRestSeconds={globalRestSeconds}
            previousPerformance={prevPerf}
            onExpand={() => {
              // Toggle: if already expanded, collapse; otherwise expand
              if (expandedSetId === set.id) {
                useSessionStore.getState().setExpanded(null);
              } else {
                useSessionStore.getState().setExpanded(set.id);
                onExpandSet(set.id);
              }
            }}
          />
        );
      })}

      {/* Add set button */}
      <AddSetButton
        onPress={() => useSessionStore.getState().addSet(exercise.id)}
      />

      {/* Progressive overload hint stub — Plan 08 fills this */}
      <View />
    </View>
  );
}

export default ExerciseCard;

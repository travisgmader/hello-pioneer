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
 * Header row: exercise name + set count caption + Shuffle icon (wires swap modal via store)
 * Body: array of SetRow components as plain View children
 * Footer: AddSetButton (appends a new set to the exercise in Zustand)
 * Progressive overload hint: renders below AddSetButton when shouldShowOverloadHint() returns
 *   true AND the user hasn't dismissed it for this exercise this session (Plan 08 — WORKOUT-14)
 *
 * Per RESEARCH.md Pitfall 1: ExerciseCard MUST NOT use local useState for any
 * cross-render state. isActive is computed from props (safe — changes on re-render).
 * Swap modal state lives in Zustand (swapModalForExerciseId) — NOT local useState,
 * since FlashList recycling would lose local state on scroll.
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Shuffle } from 'lucide-react-native';

import { ExerciseState } from '@/stores/sessionStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePreviousPerformance, useLatestBodyweight } from '@/hooks/useSessionData';
import { shouldShowOverloadHint } from '@/lib/progressiveOverload';

import { LeftEdgeBar } from '@/components/LeftEdgeBar';
import { IconButton } from '@/components/IconButton';
import { SetRow } from '@/components/SetRow';
import { AddSetButton } from '@/components/AddSetButton';
import { ProgressiveOverloadHint } from '@/components/ProgressiveOverloadHint';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseState;
  sessionId: string;
  /** Authenticated user ID — used to fetch bodyweight for bodyweight exercises (WORKOUT-12) */
  userId: string;
  unit: 'lbs' | 'kg';
  globalRestSeconds: number;
  /** True when this exercise is the next one to log (first with unlogged sets) */
  isActive: boolean;
  /** Called when user taps Shuffle to swap the exercise — opens the modal via store */
  onSwap: () => void;
  /** Called when a set's expand chevron is tapped */
  onExpandSet: (setId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExerciseCard({
  exercise,
  sessionId,
  userId,
  unit,
  globalRestSeconds,
  isActive,
  onSwap,
  onExpandSet,
}: ExerciseCardProps) {
  // Get expandedSetId and dismissedOverloadHints from store
  const expandedSetId = useSessionStore((s) => s.expandedSetId);
  const dismissedOverloadHints = useSessionStore((s) => s.dismissedOverloadHints);
  const dismissOverloadHint = useSessionStore((s) => s.dismissOverloadHint);

  // Latest bodyweight — used only when exercise.exerciseType === 'bodyweight' (WORKOUT-12)
  const { weightKg: latestBodyweightKg } = useLatestBodyweight(userId);

  // Previous performance — loaded from PowerSync for the exercise
  // includes: set_number, weight_kg, result, is_warmup (added Plan 08 for overload hint)
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

  // ── Progressive overload hint logic ────────────────────────────────────────
  // "current weight" = weight_kg from the first non-warmup, non-completed set
  const firstWorkingSet = exercise.sets.find((s) => !s.isWarmup && s.result === null);
  const currentWeightKg = firstWorkingSet?.weightKg ?? null;

  // Map PreviousPerformanceRow[] to SetRowWithWeight[] for the overload predicate
  const prevSetsForOverload = React.useMemo(() => {
    return prevPerformanceRows.map((row) => ({
      result: (row.result as 'go' | 'no-go' | null) ?? null,
      is_warmup: row.is_warmup === 1, // SQLite INTEGER 0/1 → boolean
      weight_kg: row.weight_kg,
    }));
  }, [prevPerformanceRows]);

  const showOverloadHint =
    currentWeightKg !== null &&
    !dismissedOverloadHints[exercise.exerciseId] &&
    shouldShowOverloadHint(prevSetsForOverload, currentWeightKg);

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

        {/* Shuffle icon — opens exercise swap modal via onSwap (wired in SessionScreen) */}
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

        // Superset support (Plan 06): find the partner exercise if this exercise is in a superset
        let partnerExerciseId: string | null = null;
        let supersetFirstArmId: string | null = null;
        let partnerDefaultRestSeconds: number | null = null;

        if (exercise.supersetGroup != null) {
          const storeExercises = useSessionStore.getState().exercises;
          // Partner = the other exercise in the same superset group
          const partner = storeExercises.find(
            (ex) => ex.id !== exercise.id && ex.supersetGroup === exercise.supersetGroup,
          );
          if (partner) {
            partnerExerciseId = partner.exerciseId;
            partnerDefaultRestSeconds = partner.defaultRestSeconds;
            // First arm = the exercise that comes first in the array (index is lower)
            const thisIndex = storeExercises.findIndex((ex) => ex.id === exercise.id);
            const partnerIndex = storeExercises.findIndex((ex) => ex.id === partner.id);
            supersetFirstArmId = thisIndex < partnerIndex
              ? exercise.exerciseId
              : partner.exerciseId;
          }
        }

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
            supersetGroup={exercise.supersetGroup}
            partnerExerciseId={partnerExerciseId}
            supersetFirstArmId={supersetFirstArmId}
            partnerDefaultRestSeconds={partnerDefaultRestSeconds}
            exerciseType={exercise.exerciseType}
            bodyweightKg={exercise.exerciseType === 'bodyweight' ? latestBodyweightKg : null}
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

      {/* Progressive overload hint — renders when shouldShowOverloadHint() is true
          and user hasn't dismissed it for this exercise this session (WORKOUT-14) */}
      {showOverloadHint && (
        <ProgressiveOverloadHint
          onDismiss={() => dismissOverloadHint(exercise.exerciseId)}
        />
      )}
    </View>
  );
}

export default ExerciseCard;

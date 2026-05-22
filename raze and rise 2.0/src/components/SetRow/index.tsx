/**
 * SetRow — single set row organism.
 *
 * 56pt min-height flex-row containing:
 *   - LeftEdgeBar (colored by result/warmup state)
 *   - "Set N" caption
 *   - WeightInput (decimal-pad, pre-filled from previous performance)
 *   - SetResultButton Go
 *   - SetResultButton No-Go
 *   - ExpandChevron (ChevronDown/Up 20px, 44×44pt hit area, 150ms rotation animation)
 *   - PrevPerformanceLink below the row (tap-to-fill D-09)
 *   - ExpandedSetForm below (rendered when expandedSetId === setId)
 *
 * Cross-render state (result, weightKg, isWarmup, expanded, focused) lives in
 * Zustand sessionStore — NEVER in local useState — to survive FlashList recycling
 * (RESEARCH.md Pitfall 1).
 *
 * One-at-a-time expansion: setExpanded(setId) replaces any prior expandedSetId in
 * the Zustand store — enforced by the store, not by SetRow.
 *
 * PowerSync write: on Go/No-Go tap, calls commitSet() immediately (no batching).
 * Rest timer: fires on Go tap if !isWarmup AND superset round is complete (Plan 06).
 *
 * Superset behavior (WORKOUT-11, Plan 06):
 *   - If exercise belongs to a superset (supersetGroup != null), do NOT fire rest timer
 *     until BOTH arms at this setNumber have a non-null result (supersetRoundComplete).
 *   - Instead, scrollToExerciseId(partnerExerciseId) to jump to the paired exercise.
 *   - When the round is complete (this tap completes it): start rest timer, then on
 *     timer skip/expire scroll back to the first arm for the next set pair.
 *
 * Weight validation (T-02-03 mitigation):
 *   - parseFloat on input; if NaN or out of [0, 999.9] → set error=true, do NOT commitSet
 *   - Negative or non-numeric values revert to previous weight on blur
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSessionStore } from '@/stores/sessionStore';
import { SetResult } from '@/hooks/useSetResult';
import { useRestTimer, resolveRestSeconds } from '@/hooks/useRestTimer';
import { commitSet } from '@/services/sessionService';
import { supersetRoundComplete, SetRowState } from '@/lib/supersetLogic';

import { LeftEdgeBar } from '@/components/LeftEdgeBar';
import { WeightInput } from '@/components/WeightInput';
import { SetResultButton } from '@/components/SetResultButton';
import { PrevPerformanceLink } from '@/components/PrevPerformanceLink';
import { ExpandChevron } from '@/components/ExpandChevron';
import { ExpandedSetForm } from '@/components/SetRow/ExpandedSetForm';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SetRowProps {
  setId: string;
  setNumber: number;
  exerciseId: string;
  exerciseName: string;
  sessionId: string;
  /** Rep target string (e.g. "8-10") */
  repsTarget: string;
  unit: 'lbs' | 'kg';
  defaultRestSeconds: number | null;
  globalRestSeconds: number;
  previousPerformance: {
    weightKg: number | null;
    results: ('go' | 'no-go' | null)[];
  };
  /**
   * Superset group id (template_exercises.superset_group).
   * null = standard exercise (not in a superset).
   * non-null = paired exercise; rest timer deferred until BOTH arms complete.
   */
  supersetGroup?: number | null;
  /**
   * The partner exercise id in the superset (the other arm).
   * When provided alongside supersetGroup, SetRow uses scrollToExerciseId
   * to jump to the partner after this set is committed.
   */
  partnerExerciseId?: string | null;
  /**
   * The id of the first arm (A) in the superset — used to scroll back after rest.
   * Typically the exerciseId of exercise A in the pair.
   */
  supersetFirstArmId?: string | null;
  /**
   * default_rest_seconds of the partner exercise.
   * SetRow uses the longer of the two arms' rest seconds when starting the timer
   * (conventional superset rest is the slower side).
   */
  partnerDefaultRestSeconds?: number | null;
  /** Called when the rest timer starts so SessionScreen can update lastRestSeconds */
  onRestStart?: (seconds: number) => void;
}

// ── Weight validation helper ──────────────────────────────────────────────────

function parseWeight(raw: string): number | null {
  if (raw === '' || raw === null) return null;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0 || v > 999.9) return null;
  return v;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SetRow({
  setId,
  setNumber,
  exerciseId,
  exerciseName,
  sessionId,
  repsTarget,
  unit,
  defaultRestSeconds,
  globalRestSeconds,
  previousPerformance,
  supersetGroup = null,
  partnerExerciseId = null,
  supersetFirstArmId = null,
  partnerDefaultRestSeconds = null,
  onRestStart,
}: SetRowProps) {
  // ── Zustand state ─────────────────────────────────────────────────────────

  const result = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.result;
    }
    return null as SetResult;
  });

  const weightKg = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.weightKg;
    }
    return null;
  });

  const isWarmup = useSessionStore((s) => {
    for (const ex of s.exercises) {
      const set = ex.sets.find((st) => st.id === setId);
      if (set) return set.isWarmup;
    }
    return false;
  });

  const isExpanded = useSessionStore((s) => s.expandedSetId === setId);

  const setSetWeight = useSessionStore((s) => s.setSetWeight);
  const setSetResult = useSessionStore((s) => s.setSetResult);
  const setExpanded = useSessionStore((s) => s.setExpanded);

  // ── Rest timer ────────────────────────────────────────────────────────────
  const { start: startTimer } = useRestTimer();

  // ── Local weight input state (ephemeral — the typed string, not the stored float) ──
  // This local state is acceptable because it's purely ephemeral display state
  // (the committed value is in Zustand). On FlashList recycle, this resets — which
  // is fine because we re-derive from weightKg when the component mounts.
  const [weightInput, setWeightInput] = useState<string>(
    weightKg !== null ? String(weightKg) : ''
  );
  const [weightError, setWeightError] = useState<boolean>(false);

  // ── Superset: look up partner exercise sets from the store ────────────────

  // We read partner sets lazily in the handler (getState()) to avoid over-subscribing.
  // This is correct: we only need the partner's set results at the moment of the tap.

  // ── Go/No-Go handlers ─────────────────────────────────────────────────────

  const handleGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newResult: SetResult = result === 'go' ? null : 'go';
    setSetResult(setId, newResult);

    const parsedWeight = parseWeight(weightInput);

    // Validate weight before committing (T-02-03)
    if (parsedWeight !== null || weightInput === '') {
      await commitSet({
        setId,
        sessionId,
        exerciseId,
        exerciseName,
        setNumber,
        weightKg: parsedWeight,
        repsTarget,
        result: newResult,
        rpe: null,
        isWarmup,
        notes: null,
      });
    }

    // ── Rest timer / superset scroll logic ──────────────────────────────────
    if (newResult === 'go' && !isWarmup) {
      if (supersetGroup != null && partnerExerciseId) {
        // Superset: check whether this tap completes the round (both arms done)
        const storeState = useSessionStore.getState();
        const exercises = storeState.exercises;

        // Build partner sets as SetRowState[] for supersetRoundComplete
        const partnerExercise = exercises.find(
          (ex) => ex.exerciseId === partnerExerciseId || ex.id === partnerExerciseId,
        );
        const partnerSets: SetRowState[] = (partnerExercise?.sets ?? []).map((s) => ({
          setNumber: s.setNumber,
          result: s.result,
        }));

        // This exercise's current sets — include the new result we just set
        const thisExercise = exercises.find(
          (ex) => ex.sets.some((s) => s.id === setId),
        );
        const thisSets: SetRowState[] = (thisExercise?.sets ?? []).map((s) => ({
          setNumber: s.setNumber,
          result: s.id === setId ? newResult : s.result,
        }));

        const roundComplete = supersetRoundComplete(thisSets, partnerSets, setNumber);

        if (!roundComplete) {
          // Round not yet complete — scroll to partner; do NOT start rest timer
          storeState.scrollToExerciseId(partnerExerciseId);
        } else {
          // Both arms done — resolve rest seconds (use the longer of the two arms)
          const thisRest = resolveRestSeconds(defaultRestSeconds, globalRestSeconds);
          const partnerRest = resolveRestSeconds(partnerDefaultRestSeconds, globalRestSeconds);
          const restSeconds = Math.max(thisRest, partnerRest);
          onRestStart?.(restSeconds);
          await startTimer(restSeconds);
          // After timer ends/skips, scroll back to the first arm for the next set pair
          // This is handled by the RestTimerPill onSkip wired in SessionScreen (Plan 06)
          // which calls scrollToExerciseId(supersetFirstArmId) after cancel().
          // We store the firstArmId in the superset cursor for that callback to use.
          storeState.advanceSupersetCursor(
            supersetFirstArmId
              ? {
                  groupId: supersetGroup,
                  arm: 'A',
                  setNumber: setNumber + 1,
                }
              : null,
          );
        }
      } else {
        // Standard (non-superset) exercise — existing behavior
        const restSeconds = resolveRestSeconds(defaultRestSeconds, globalRestSeconds);
        onRestStart?.(restSeconds);
        await startTimer(restSeconds);
      }
    }
  }, [result, setId, sessionId, exerciseId, exerciseName, setNumber, weightInput, repsTarget, isWarmup, defaultRestSeconds, globalRestSeconds, supersetGroup, partnerExerciseId, supersetFirstArmId, partnerDefaultRestSeconds, setSetResult, startTimer, onRestStart]);

  const handleNoGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newResult: SetResult = result === 'no-go' ? null : 'no-go';
    setSetResult(setId, newResult);

    const parsedWeight = parseWeight(weightInput);

    if (parsedWeight !== null || weightInput === '') {
      await commitSet({
        setId,
        sessionId,
        exerciseId,
        exerciseName,
        setNumber,
        weightKg: parsedWeight,
        repsTarget,
        result: newResult,
        rpe: null,
        isWarmup,
        notes: null,
      });
    }

    // Superset No-Go: treat the same as Go for the scroll logic —
    // No-Go is a valid result; the round can still be "complete" if the other arm is done.
    if (newResult === 'no-go' && !isWarmup && supersetGroup != null && partnerExerciseId) {
      const storeState = useSessionStore.getState();
      const exercises = storeState.exercises;

      const partnerExercise = exercises.find(
        (ex) => ex.exerciseId === partnerExerciseId || ex.id === partnerExerciseId,
      );
      const partnerSets: SetRowState[] = (partnerExercise?.sets ?? []).map((s) => ({
        setNumber: s.setNumber,
        result: s.result,
      }));

      const thisExercise = exercises.find(
        (ex) => ex.sets.some((s) => s.id === setId),
      );
      const thisSets: SetRowState[] = (thisExercise?.sets ?? []).map((s) => ({
        setNumber: s.setNumber,
        result: s.id === setId ? newResult : s.result,
      }));

      const roundComplete = supersetRoundComplete(thisSets, partnerSets, setNumber);

      if (!roundComplete) {
        storeState.scrollToExerciseId(partnerExerciseId);
      }
      // If round complete on No-Go: no rest timer on No-Go (existing behavior)
    }
    // Standard No-Go: no rest timer
  }, [result, setId, sessionId, exerciseId, exerciseName, setNumber, weightInput, repsTarget, isWarmup, supersetGroup, partnerExerciseId, setSetResult]);

  // ── Weight input handlers ─────────────────────────────────────────────────

  const handleWeightChange = useCallback((text: string) => {
    setWeightInput(text);
    const parsed = parseWeight(text);
    if (text === '' || parsed !== null) {
      setWeightError(false);
      setSetWeight(setId, parsed);
    } else {
      setWeightError(true);
    }
  }, [setId, setSetWeight]);

  const handleWeightBlur = useCallback(() => {
    // On blur: if invalid, revert to the stored weightKg value
    if (weightError) {
      setWeightInput(weightKg !== null ? String(weightKg) : '');
      setWeightError(false);
    }
  }, [weightError, weightKg]);

  // ── Expand chevron handler (one-at-a-time: store enforces single expanded) ─

  const handleExpand = useCallback(() => {
    // If already expanded → collapse (pass null). Otherwise expand this row.
    // The store replaces any prior expandedSetId, enforcing one-at-a-time.
    setExpanded(isExpanded ? null : setId);
  }, [isExpanded, setId, setExpanded]);

  // ── LeftEdgeBar variant ───────────────────────────────────────────────────

  const edgeBarVariant =
    result === 'go'
      ? 'accent'
      : result === 'no-go'
      ? 'danger'
      : isWarmup
      ? 'subtle'
      : 'none';

  // ── Auto-fill from previous performance ──────────────────────────────────

  const handleAutoFill = useCallback(() => {
    const prevWeight = previousPerformance.weightKg;
    if (prevWeight !== null) {
      setWeightInput(String(prevWeight));
      setSetWeight(setId, prevWeight);
    }
  }, [previousPerformance.weightKg, setId, setSetWeight]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View>
      {/* Main row — 56pt min-height */}
      <View className="flex-row items-center gap-sm" style={{ minHeight: 56 }}>
        {/* Left edge bar — 2px color indicator */}
        <LeftEdgeBar variant={edgeBarVariant} />

        {/* Set number caption */}
        <Text className="text-caption text-fg-muted w-8" allowFontScaling={false}>
          Set {setNumber}
        </Text>

        {/* Weight input */}
        <WeightInput
          value={weightInput}
          onChangeText={handleWeightChange}
          onBlur={handleWeightBlur}
          error={weightError}
          placeholder="0"
          style={{ flex: 1 }}
        />

        {/* Go button */}
        <SetResultButton
          variant="go"
          selected={result === 'go'}
          onPress={handleGo}
          setNumber={setNumber}
        />

        {/* No-Go button */}
        <SetResultButton
          variant="no-go"
          selected={result === 'no-go'}
          onPress={handleNoGo}
          setNumber={setNumber}
        />

        {/* Expand chevron — 44×44pt, 150ms rotation animation */}
        <ExpandChevron
          expanded={isExpanded}
          onPress={handleExpand}
        />
      </View>

      {/* Previous performance link — tap-to-fill (D-09) */}
      <View className="pl-[2px] pb-xs">
        <PrevPerformanceLink
          weightKg={previousPerformance.weightKg}
          unit={unit}
          results={previousPerformance.results}
          onAutoFill={handleAutoFill}
        />
      </View>

      {/* Expanded section — inline RPE/warmup/notes form (Plan 05) */}
      {isExpanded && (
        <ExpandedSetForm
          setId={setId}
          sessionId={sessionId}
          exerciseId={exerciseId}
          exerciseName={exerciseName}
          setNumber={setNumber}
          weightKg={weightKg}
          repsTarget={repsTarget}
          result={result}
        />
      )}
    </View>
  );
}

export default SetRow;

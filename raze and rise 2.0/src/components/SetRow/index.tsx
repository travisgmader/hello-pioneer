/**
 * SetRow — single set row organism.
 *
 * 56pt min-height flex-row containing:
 *   - LeftEdgeBar (colored by result/warmup state)
 *   - "Set N" caption
 *   - WeightInput (decimal-pad, pre-filled from previous performance)
 *   - SetResultButton Go
 *   - SetResultButton No-Go
 *   - ExpandChevron (ChevronDown/Up 20px, 44×44pt hit area)
 *   - PrevPerformanceLink below the row (tap-to-fill D-09)
 *
 * Cross-render state (result, weightKg, isWarmup, expanded, focused) lives in
 * Zustand sessionStore — NEVER in local useState — to survive FlashList recycling
 * (RESEARCH.md Pitfall 1).
 *
 * PowerSync write: on Go/No-Go tap, calls commitSet() immediately (no batching).
 * Rest timer: fires on Go tap if !isWarmup via useRestTimer().start(resolveRestSeconds(...)).
 *
 * Weight validation (T-02-03 mitigation):
 *   - parseFloat on input; if NaN or out of [0, 999.9] → set error=true, do NOT commitSet
 *   - Negative or non-numeric values revert to previous weight on blur
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSessionStore } from '@/stores/sessionStore';
import { SetResult } from '@/hooks/useSetResult';
import { useRestTimer, resolveRestSeconds } from '@/hooks/useRestTimer';
import { commitSet } from '@/services/sessionService';

import { LeftEdgeBar } from '@/components/LeftEdgeBar';
import { WeightInput } from '@/components/WeightInput';
import { SetResultButton } from '@/components/SetResultButton';
import { PrevPerformanceLink } from '@/components/PrevPerformanceLink';
import { IconButton } from '@/components/IconButton';

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
  onExpand: () => void;
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
  onExpand,
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

    // Start rest timer only on Go transition AND not a warmup (UI-SPEC.md step 5)
    if (newResult === 'go' && !isWarmup) {
      const restSeconds = resolveRestSeconds(defaultRestSeconds, globalRestSeconds);
      await startTimer(restSeconds);
    }
  }, [result, setId, sessionId, exerciseId, exerciseName, setNumber, weightInput, repsTarget, isWarmup, defaultRestSeconds, globalRestSeconds, setSetResult, startTimer]);

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
    // No rest timer on No-Go
  }, [result, setId, sessionId, exerciseId, exerciseName, setNumber, weightInput, repsTarget, isWarmup, setSetResult]);

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

  // ── Expand chevron handler ────────────────────────────────────────────────

  const handleExpand = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExpand();
  }, [onExpand]);

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

        {/* Expand chevron — 44×44pt hit area — Plan 05 fills the expanded form */}
        <IconButton
          icon={isExpanded
            ? <ChevronUp size={20} color="#99907C" />
            : <ChevronDown size={20} color="#99907C" />
          }
          onPress={handleExpand}
          accessibilityLabel={isExpanded ? 'Collapse set details' : 'Expand set details'}
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

      {/* Expanded section — Plan 05 fills the inline RPE/warmup/notes form */}
      {isExpanded && <View />}
    </View>
  );
}

export default SetRow;

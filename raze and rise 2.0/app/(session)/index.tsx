/**
 * SessionScreen — the active workout logging screen (D-01, WORKOUT-01, WORKOUT-02, WORKOUT-18).
 *
 * Full-screen route outside (tabs) — tab bar is hidden during a workout.
 * Session starts from the Workouts tab via router.push('/(session)/').
 *
 * Lifecycle:
 *   1. Mount: activate keep-awake + initAudioMode (fire-and-forget)
 *   2. Check MMKV active_session_id:
 *      - Exists → rehydrate: load template, restore exercises into Zustand store
 *      - Absent → startSession(): generate UUID, save to MMKV, load exercises into store
 *   3. If no template for today → route back to workouts (Plan 08 handles skip-day flow)
 *   4. Render: SafeAreaView → SessionHeader → FlashList<FlashListItem> → RestTimerPill
 *   5. Unmount: deactivate keep-awake
 *
 * FlashList v2 specifics (RESEARCH.md Pattern 1):
 *   - No estimatedItemSize (v2 auto-sizes)
 *   - No CellContainer
 *   - FlashListRef<FlashListItem> type for ref (Plan 06 — superset scroll)
 *
 * Superset support (Plan 06 — WORKOUT-11):
 *   - FlashList data is built via buildFlashListData(exercises) — superset pairs are
 *     deduplicated into a single { type: 'superset-pair', ... } item
 *   - renderItem branches on item.type: 'single' → ExerciseCard; 'superset-pair' → SupersetPair
 *   - listRef registered in sessionStore via setListRef() for superset auto-scroll
 *   - RestTimerPill onSkip callback scrolls back to the first superset arm after rest
 *
 * handleComplete (Plan 04 stub): router.replace('/(tabs)') — Plan 07 wires the Anubis flow.
 *
 * RestTimerPill: always rendered (returns null when remaining===null — no placeholder space).
 * RestTimerPill needs lastStartedRestSeconds to compute the drain bar. We track it in
 * component state so the drain bar knows the full duration of the current timer.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { useSession } from '@/hooks/useSession';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useTodaysTemplate } from '@/hooks/useSessionData';
import { useSessionStore, ExerciseState } from '@/stores/sessionStore';
import { useRestTimer } from '@/hooks/useRestTimer';
import { startSession } from '@/services/sessionService';
import { initAudioMode } from '@/lib/audio';
import { buildFlashListData, FlashListItem } from '@/lib/supersetLogic';

import { SessionHeader } from '@/components/SessionHeader';
import { ExerciseCard } from '@/components/ExerciseCard';
import { SupersetPair } from '@/components/SupersetPair';
import { RestTimerPill } from '@/components/RestTimerPill';

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionScreen() {
  const { session } = useSession();
  const userId = session?.user?.id ?? '';

  // MMKV session persistence
  const { sessionId, startedAt, saveSession } = useSessionPersistence();

  // Today's template + exercises from PowerSync
  const { template, exercises: templateExercises, splitSettings, globalRestSeconds } = useTodaysTemplate(userId);

  // Zustand session store
  const loadExercises = useSessionStore((s) => s.loadExercises);
  const exercises = useSessionStore((s) => s.exercises);

  // Rest timer
  const { remaining, cancel, addSeconds } = useRestTimer();

  // Track the last started rest duration for the pill drain bar
  const [lastRestSeconds, setLastRestSeconds] = useState<number>(90);

  // FlashList ref — registered in sessionStore for superset auto-scroll (Plan 06, Pitfall 8)
  const listRef = useRef<FlashListRef<FlashListItem>>(null);

  // Zustand scroll/cursor actions
  const setListRef = useSessionStore((s) => s.setListRef);
  const supersetCursor = useSessionStore((s) => s.supersetCursor);
  const scrollToExerciseId = useSessionStore((s) => s.scrollToExerciseId);

  // Track whether we've initialized the session (avoid double-init on re-renders)
  const initialized = useRef(false);

  // ── Keep-awake lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    // Activate keep-awake + audio mode on mount
    activateKeepAwakeAsync('session-active').catch(() => {});
    initAudioMode().catch(() => {}); // fire-and-forget

    return () => {
      deactivateKeepAwake('session-active');
    };
  }, []);

  // ── Register FlashList ref in store for superset auto-scroll (Plan 06) ───
  useEffect(() => {
    setListRef(listRef.current);
    return () => setListRef(null);
  }, [setListRef]);

  // ── Session init / rehydration ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !template || initialized.current) return;

    initialized.current = true;

    if (sessionId) {
      // Rehydrate: session already exists in MMKV, load exercises from template
      loadExercises(templateExercises);
    } else {
      // New session: generate UUID, save to MMKV, load exercises
      startSession({
        userId,
        templateId: template.id,
        dayLabel: template.day_label,
        exercises: templateExercises,
      }).then(() => {
        loadExercises(templateExercises);
      }).catch((err) => {
        console.warn('[SessionScreen] startSession failed:', err);
        loadExercises(templateExercises);
      });
    }
  }, [userId, template, sessionId, templateExercises, loadExercises]);

  // ── No template for today → bounce back (Plan 08 handles skip-day flow) ────
  useEffect(() => {
    if (userId && template === null && !initialized.current) {
      router.replace('/(tabs)/workouts' as never);
    }
  }, [userId, template]);

  // ── Build FlashList data via supersetLogic (Plan 06 — Pitfall 8) ──────────
  // buildFlashListData deduplicates superset pairs so each group appears once.
  // The FlashList item type is FlashListItem (single | superset-pair).
  const flashListData = buildFlashListData(exercises);

  // Build an exercise lookup map for renderItem
  const exerciseById = React.useMemo(() => {
    const map = new Map<string, ExerciseState>();
    for (const ex of exercises) {
      map.set(ex.id, ex);
      map.set(ex.exerciseId, ex); // also keyed by exerciseId for partner lookups
    }
    return map;
  }, [exercises]);

  // ── Compute active exercise — first with any unlogged set ─────────────────
  const currentExerciseId = exercises.find((ex) =>
    ex.sets.some((s) => s.result === null)
  )?.id ?? null;

  // ── Complete handler (Plan 04 stub — Plan 07 wires the Anubis flow) ──────
  const handleComplete = () => {
    router.replace('/(tabs)' as never);
  };

  // ── Rest timer skip/expire → scroll back to superset first arm (Plan 06) ─
  const handleRestSkip = useCallback(async () => {
    await cancel();
    // If a superset cursor is set, scroll back to first arm (A) for next set pair
    if (supersetCursor) {
      const exercises = useSessionStore.getState().exercises;
      // Find the A exercise in this superset group
      const firstArmExercise = exercises.find(
        (ex) => ex.supersetGroup === supersetCursor.groupId,
      );
      if (firstArmExercise) {
        scrollToExerciseId(firstArmExercise.id);
      }
    }
  }, [cancel, supersetCursor, scrollToExerciseId]);

  // ── Unit preference — derived from profiles (default lbs for Phase 2) ──────
  const unit = 'lbs' as const;

  // ── renderItem helper ─────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: FlashListItem }) => {
    if (item.type === 'single') {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise) return null;
      return (
        <ExerciseCard
          exercise={exercise}
          sessionId={sessionId ?? ''}
          unit={unit}
          globalRestSeconds={globalRestSeconds}
          isActive={exercise.id === currentExerciseId}
          onSwap={() => {/* Plan 08 wires exercise swap modal */}}
          onExpandSet={(setId) => useSessionStore.getState().setExpanded(setId)}
        />
      );
    }

    // superset-pair
    const exerciseA = exerciseById.get(item.exerciseAId);
    const exerciseB = exerciseById.get(item.exerciseBId);
    if (!exerciseA || !exerciseB) return null;

    // Determine active arm: whichever arm has the first unlogged set
    let activeArm: 'A' | 'B' | null = null;
    if (exerciseA.sets.some((s) => s.result === null)) {
      activeArm = 'A';
    } else if (exerciseB.sets.some((s) => s.result === null)) {
      activeArm = 'B';
    }

    return (
      <SupersetPair
        exerciseA={exerciseA}
        exerciseB={exerciseB}
        sessionId={sessionId ?? ''}
        unit={unit}
        globalRestSeconds={globalRestSeconds}
        activeArm={activeArm}
        onSwapA={() => {/* Plan 08 */}}
        onSwapB={() => {/* Plan 08 */}}
        onExpandSet={(setId) => useSessionStore.getState().setExpanded(setId)}
      />
    );
  }, [exerciseById, sessionId, unit, globalRestSeconds, currentExerciseId]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Session header — elapsed timer + day label + Complete button */}
      <SessionHeader
        dayLabel={template?.day_label ?? template?.name ?? 'Workout'}
        startedAt={startedAt ?? new Date().toISOString()}
        onComplete={handleComplete}
      />

      {/* Exercise list — FlashList v2 (no estimatedItemSize per Pattern 1) */}
      {/* Data is FlashListItem[] from buildFlashListData — superset pairs deduplicated */}
      <FlashList
        ref={listRef}
        data={flashListData}
        keyExtractor={(item) =>
          item.type === 'single' ? item.exerciseId : `pair-${item.groupId}`
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View className="h-md" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}
      />

      {/* Rest timer pill — floating overlay, returns null when inactive */}
      {/* onSkip scrolls back to superset first arm after rest (Plan 06) */}
      <RestTimerPill
        remaining={remaining}
        totalSeconds={lastRestSeconds}
        onSkip={handleRestSkip}
        onAddSeconds={addSeconds}
      />
    </SafeAreaView>
  );
}

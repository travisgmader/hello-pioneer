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
 *   4. Render: SafeAreaView → SessionHeader → FlashList<FlashListItem> → RestTimerPill → AnubisOverlay
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
 * Complete Workout flow (Plan 07 — WORKOUT-17 + DESIGN-03):
 *   1. handleComplete fires Haptics.notificationAsync(Success)
 *   2. setAnubisVisible(true) — overlay fades in
 *   3. cancelRestTimer() in parallel (fire-and-forget)
 *   4. completeSession() runs during Lottie playback (atomic writeTransaction)
 *   5. AnubisOverlay.onFadeOutComplete → router.replace('/(tabs)/')
 *   On completeSession failure: logs warn; navigation still proceeds (UI-SPEC.md Lottie fail fallback)
 *
 * Android hardware back (UI-SPEC.md Back / Cancel):
 *   BackHandler.addEventListener — shows Alert.alert:
 *   - Title: "End workout?"
 *   - Body: "Your logged sets will be saved."
 *   - "Keep going" (cancel) → stay on screen
 *   - "End workout" (destructive) → handleComplete()
 *   Returns true to consume the event (suppress default OS back behavior).
 *   iOS swipe-back is disabled via gestureEnabled: false in (session)/_layout.tsx.
 *
 * RestTimerPill: always rendered (returns null when remaining===null — no placeholder space).
 * RestTimerPill needs lastStartedRestSeconds to compute the drain bar. We track it in
 * component state so the drain bar knows the full duration of the current timer.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Alert, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { useSession } from '@/hooks/useSession';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useTodaysTemplate } from '@/hooks/useSessionData';
import { useSessionStore, ExerciseState } from '@/stores/sessionStore';
import { useRestTimer } from '@/hooks/useRestTimer';
import { startSession, completeSession } from '@/services/sessionService';
import { initAudioMode } from '@/lib/audio';
import { buildFlashListData, FlashListItem } from '@/lib/supersetLogic';

import { SessionHeader } from '@/components/SessionHeader';
import { ExerciseCard } from '@/components/ExerciseCard';
import { SupersetPair } from '@/components/SupersetPair';
import { RestTimerPill } from '@/components/RestTimerPill';
import { AnubisOverlay } from '@/components/AnubisOverlay';
import { ExerciseSwapModal } from '@/components/ExerciseSwapModal';
import { SessionNoteSheet } from '@/components/SessionNoteSheet';

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

  // Anubis overlay visibility — set to true when handleComplete fires
  const [anubisVisible, setAnubisVisible] = useState(false);

  // FlashList ref — registered in sessionStore for superset auto-scroll (Plan 06, Pitfall 8)
  const listRef = useRef<FlashListRef<FlashListItem>>(null);

  // Zustand scroll/cursor actions
  const setListRef = useSessionStore((s) => s.setListRef);
  const supersetCursor = useSessionStore((s) => s.supersetCursor);
  const scrollToExerciseId = useSessionStore((s) => s.scrollToExerciseId);

  // Swap modal state (Plan 08 — WORKOUT-15)
  const swapModalForExerciseId = useSessionStore((s) => s.swapModalForExerciseId);
  const openSwapModal = useSessionStore((s) => s.openSwapModal);
  const closeSwapModal = useSessionStore((s) => s.closeSwapModal);
  const swapExercise = useSessionStore((s) => s.swapExercise);

  // Note sheet state (Plan 08 — WORKOUT-09)
  const noteSheetOpen = useSessionStore((s) => s.noteSheetOpen);
  const openNoteSheet = useSessionStore((s) => s.openNoteSheet);
  const closeNoteSheet = useSessionStore((s) => s.closeNoteSheet);
  const sessionNotes = useSessionStore((s) => s.sessionNotes);
  const setSessionNotes = useSessionStore((s) => s.setSessionNotes);

  // Body map sore muscles (Plan 09 — WORKOUT-10)
  const soreMuscles = useSessionStore((s) => s.soreMuscles);

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

  // ── Complete handler — wires Anubis flow + PowerSync atomic commit (Plan 07) ──
  // Sequence per UI-SPEC.md Motion — Anubis:
  //   1. Haptic feedback (Success) — must fire before any async work
  //   2. setAnubisVisible(true) — overlay fade-in STARTS (not awaited)
  //   3. cancelRestTimer() — fire-and-forget; clears any pending rest notification
  //   4. completeSession() — runs DURING Lottie playback (atomic writeTransaction)
  //   5. onFadeOutComplete (in AnubisOverlay) — navigates to Dashboard
  // On completeSession failure: log warn; navigation still proceeds (Lottie fail fallback)
  const handleComplete = useCallback(async () => {
    // 1. Success haptic — fires immediately before any async work (UI-SPEC.md haptic table)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 2. Fade-in starts — setAnubisVisible is synchronous; overlay begins rendering
    setAnubisVisible(true);

    // 3. Cancel any pending rest timer notification (fire-and-forget)
    cancel().catch(() => {});

    // 4. Atomic PowerSync commit during Lottie playback
    try {
      // Serialize session notes + sore muscles into a single JSON blob (Plan 09 — WORKOUT-10)
      // Shape: { text: string, soreMuscles: string[] }
      const notesPayload = sessionNotes || soreMuscles.length > 0
        ? JSON.stringify({ text: sessionNotes || '', soreMuscles })
        : null;

      await completeSession({
        sessionId: sessionId ?? '',
        userId,
        templateId: template?.id ?? '',
        dayLabel: template?.day_label ?? template?.name ?? '',
        startedAt: startedAt ?? new Date().toISOString(),
        // Merged notes: free text + sore muscle IDs (Plan 09 extension of Plan 08 shape)
        sessionNotes: notesPayload,
      });
    } catch (err) {
      // completeSession failed — log but do NOT block navigation.
      // The Anubis animation continues to play; onFadeOutComplete will navigate
      // to Dashboard regardless. PowerSync will retry the write when sync resumes.
      // UI-SPEC.md: "Anubis Lottie fails to load → Fallback: 600ms blank bg-colored
      // overlay, then proceed to Dashboard." Same fallback applies to write failures.
      console.warn('[SessionScreen] completeSession failed — navigating anyway:', err);
    }
    // Navigation happens via AnubisOverlay.onFadeOutComplete below
  }, [sessionId, userId, template, startedAt, cancel, sessionNotes]);

  // ── Android hardware back handler (UI-SPEC.md Back / Cancel) ─────────────
  // BackHandler only fires on Android — safe to register on iOS (no-op there).
  // iOS swipe-back is already disabled via gestureEnabled:false in _layout.tsx.
  // Returns true to consume the event (suppresses default OS back behavior).
  // Alert copy from UI-SPEC.md: single Phase 2 exception to no-alerts rule.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'End workout?',
        'Your logged sets will be saved.',
        [
          {
            text: 'Keep going',
            style: 'cancel',
          },
          {
            text: 'End workout',
            style: 'destructive',
            onPress: () => { void handleComplete(); },
          },
        ],
      );
      return true; // Consume the event — suppress default OS back behavior (T-02-11)
    });

    return () => { subscription.remove(); };
  }, [handleComplete]);

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

  // ── Swap modal: look up exercise name for the current swap target ──────────
  // The modal needs the current exercise name to display in the header
  const swapModalExercise = swapModalForExerciseId
    ? exercises.find((ex) => ex.exerciseId === swapModalForExerciseId) ??
      exercises.find((ex) => ex.id === swapModalForExerciseId) ??
      null
    : null;

  // ── Swap modal: handle selection ──────────────────────────────────────────
  const handleSwapSelect = useCallback(
    (newExercise: { id: string; name: string; primaryMuscle: string }) => {
      if (!swapModalForExerciseId) return;
      // Find the slot index for the exercise being swapped
      const slotIndex = exercises.findIndex(
        (ex) => ex.exerciseId === swapModalForExerciseId || ex.id === swapModalForExerciseId
      );
      if (slotIndex >= 0) {
        swapExercise(slotIndex, { id: newExercise.id, name: newExercise.name });
      }
      closeSwapModal();
    },
    [swapModalForExerciseId, exercises, swapExercise, closeSwapModal]
  );

  // ── renderItem helper ─────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: FlashListItem }) => {
    if (item.type === 'single') {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise) return null;
      return (
        <ExerciseCard
          exercise={exercise}
          sessionId={sessionId ?? ''}
          userId={userId}
          unit={unit}
          globalRestSeconds={globalRestSeconds}
          isActive={exercise.id === currentExerciseId}
          onSwap={() => openSwapModal(exercise.exerciseId)}
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
        userId={userId}
        unit={unit}
        globalRestSeconds={globalRestSeconds}
        activeArm={activeArm}
        onSwapA={() => openSwapModal(exerciseA.exerciseId)}
        onSwapB={() => openSwapModal(exerciseB.exerciseId)}
        onExpandSet={(setId) => useSessionStore.getState().setExpanded(setId)}
      />
    );
  }, [exerciseById, sessionId, unit, globalRestSeconds, currentExerciseId, openSwapModal]);

  // ── Body map handler — opens body-map in mid-session mode ─────────────────
  const handleOpenBodyMap = useCallback(() => {
    router.push('/(session)/body-map?mode=mid' as never);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Session header — elapsed timer + day label + Complete button + Note button + Body map button */}
      <SessionHeader
        dayLabel={template?.day_label ?? template?.name ?? 'Workout'}
        startedAt={startedAt ?? new Date().toISOString()}
        onComplete={handleComplete}
        onOpenNote={openNoteSheet}
        onOpenBodyMap={handleOpenBodyMap}
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

      {/* Anubis completion overlay (Plan 07 — DESIGN-03) */}
      {/* Fades in when handleComplete fires; fades out and navigates after Lottie plays */}
      <AnubisOverlay
        visible={anubisVisible}
        onFadeOutComplete={() => {
          router.replace('/(tabs)/' as never);
        }}
      />

      {/* Exercise swap modal (Plan 08 — WORKOUT-15) */}
      {/* Rendered once at the session screen level (not per-card) — avoids mounting one Modal per FlashList item */}
      <ExerciseSwapModal
        visible={swapModalForExerciseId !== null}
        currentExerciseName={swapModalExercise?.exerciseName ?? ''}
        onSelect={handleSwapSelect}
        onClose={closeSwapModal}
      />

      {/* Session note sheet (Plan 08 — WORKOUT-09) */}
      <SessionNoteSheet
        visible={noteSheetOpen}
        initialValue={sessionNotes}
        onSave={setSessionNotes}
        onClose={closeNoteSheet}
      />
    </SafeAreaView>
  );
}

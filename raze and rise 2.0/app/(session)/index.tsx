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
 *   4. Render: SafeAreaView → SessionHeader → FlashList<ExerciseCard> → RestTimerPill
 *   5. Unmount: deactivate keep-awake
 *
 * FlashList v2 specifics (RESEARCH.md Pattern 1):
 *   - No estimatedItemSize (v2 auto-sizes)
 *   - No CellContainer
 *   - FlashListRef<ExerciseState> type for ref
 *
 * handleComplete (Plan 04 stub): router.replace('/(tabs)') — Plan 07 wires the Anubis flow.
 *
 * RestTimerPill: always rendered (returns null when remaining===null — no placeholder space).
 * RestTimerPill needs lastStartedRestSeconds to compute the drain bar. We track it in
 * component state so the drain bar knows the full duration of the current timer.
 */

import React, { useEffect, useRef, useState } from 'react';
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

import { SessionHeader } from '@/components/SessionHeader';
import { ExerciseCard } from '@/components/ExerciseCard';
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

  // FlashList ref for future scrollToIndex (superset auto-scroll in Plan 11)
  const listRef = useRef<FlashListRef<ExerciseState>>(null);

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

  // ── Compute active exercise index ───────────────────────────────────────────
  // The first exercise whose sets are not all logged is "active"
  const currentExerciseIndex = exercises.findIndex((ex) =>
    ex.sets.some((s) => s.result === null)
  );

  // ── Complete handler (Plan 04 stub — Plan 07 wires the Anubis flow) ──────
  const handleComplete = () => {
    router.replace('/(tabs)' as never);
  };

  // ── Unit preference — derived from profiles (default lbs for Phase 2) ──────
  const unit = 'lbs' as const;

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
      <FlashList
        ref={listRef}
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExerciseCard
            exercise={item}
            sessionId={sessionId ?? ''}
            unit={unit}
            globalRestSeconds={globalRestSeconds}
            isActive={index === currentExerciseIndex}
            onSwap={() => {/* Plan 08 wires exercise swap modal */}}
            onExpandSet={(setId) => useSessionStore.getState().setExpanded(setId)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-md" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}
      />

      {/* Rest timer pill — floating overlay, returns null when inactive */}
      <RestTimerPill
        remaining={remaining}
        totalSeconds={lastRestSeconds}
        onSkip={cancel}
        onAddSeconds={addSeconds}
      />
    </SafeAreaView>
  );
}

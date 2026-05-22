/**
 * sessionStore — Zustand store for the active workout session.
 *
 * All FlashList row state (expanded/focused set, set results/weight/RPE/warmup)
 * lives here — NEVER in local useState within ExerciseCard or SetRow.
 *
 * Rationale (RESEARCH.md Pitfall 1): FlashList v2 recycles component instances.
 * useState inside a recycled component carries stale values from the previous
 * item. Keying all per-set state by set UUID in Zustand prevents ghost states.
 *
 * State shape:
 *   exercises[]      — ordered array of ExerciseState (loaded from today's template)
 *   expandedSetId    — only ONE set can be expanded at a time (UI-SPEC.md rule)
 *   focusedSetId     — which set has keyboard focus (WeightInput)
 *
 * Actions:
 *   loadExercises    — replace the exercises array (called once on session init)
 *   setSetResult     — mark a set go / no-go / null
 *   setSetWeight     — update weight for a set
 *   setSetRpe        — update RPE (1-10) for a set
 *   setSetWarmup     — toggle warm-up flag for a set
 *   setSetNotes      — update notes for a set
 *   setExpanded      — expand one set row, collapsing any previously expanded one
 *   setFocused       — mark which set has keyboard focus
 *   addSet           — append a new set to an exercise (pre-fills weight from last set)
 *   swapExercise     — replace an exercise at a given slot index (Plan 08 wires the UI)
 */

import { create } from 'zustand';
import { SetResult } from '@/hooks/useSetResult';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SetState {
  /** Client-generated UUID — stable across recycles */
  id: string;
  setNumber: number;
  weightKg: number | null;
  result: SetResult;
  rpe: number | null;
  isWarmup: boolean;
  notes: string | null;
}

export interface ExerciseState {
  /** template_exercises.id — used as FlashList keyExtractor */
  id: string;
  /** Master exercise library id */
  exerciseId: string;
  exerciseName: string;
  setCount: number;
  repLow: number;
  repHigh: number;
  exerciseType: 'standard' | 'bodyweight' | 'run';
  defaultRestSeconds: number | null;
  supersetGroup: number | null;
  sets: SetState[];
}

interface SessionState {
  exercises: ExerciseState[];
  expandedSetId: string | null;
  focusedSetId: string | null;

  // ── Actions ─────────────────────────────────────────────────────────────
  loadExercises: (exercises: ExerciseState[]) => void;
  setSetResult: (setId: string, result: SetResult) => void;
  setSetWeight: (setId: string, weightKg: number | null) => void;
  setSetRpe: (setId: string, rpe: number | null) => void;
  setSetWarmup: (setId: string, isWarmup: boolean) => void;
  setSetNotes: (setId: string, notes: string | null) => void;
  setExpanded: (setId: string | null) => void;
  setFocused: (setId: string | null) => void;
  addSet: (exerciseId: string) => void;
  swapExercise: (slotIndex: number, newExercise: ExerciseState) => void;
}

// ── Helper — mutate a single set by id across all exercises ──────────────────

function mutateSets(
  exercises: ExerciseState[],
  setId: string,
  mutator: (s: SetState) => SetState,
): ExerciseState[] {
  return exercises.map((ex) => {
    const hasMatch = ex.sets.some((s) => s.id === setId);
    if (!hasMatch) return ex;
    return { ...ex, sets: ex.sets.map((s) => (s.id === setId ? mutator(s) : s)) };
  });
}

// ── UUID generation (safe for React Native + Hermes) ─────────────────────────
// crypto.randomUUID() is available in Hermes on RN 0.71+ (exposed as global).
// Falls back to Math.random for test environments.

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for test environments (node/vitest)
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>((set, get) => ({
  exercises: [],
  expandedSetId: null,
  focusedSetId: null,

  // Replace the entire exercises array (called on session init or rehydration)
  loadExercises: (exercises) => set({ exercises }),

  // Set result for a specific set (go / no-go / null)
  setSetResult: (setId, result) =>
    set((state) => ({
      exercises: mutateSets(state.exercises, setId, (s) => ({ ...s, result })),
    })),

  // Update weight for a specific set
  setSetWeight: (setId, weightKg) =>
    set((state) => ({
      exercises: mutateSets(state.exercises, setId, (s) => ({ ...s, weightKg })),
    })),

  // Update RPE (1–10) for a specific set
  setSetRpe: (setId, rpe) =>
    set((state) => ({
      exercises: mutateSets(state.exercises, setId, (s) => ({ ...s, rpe })),
    })),

  // Toggle warm-up flag for a specific set
  setSetWarmup: (setId, isWarmup) =>
    set((state) => ({
      exercises: mutateSets(state.exercises, setId, (s) => ({ ...s, isWarmup })),
    })),

  // Update notes for a specific set
  setSetNotes: (setId, notes) =>
    set((state) => ({
      exercises: mutateSets(state.exercises, setId, (s) => ({ ...s, notes })),
    })),

  // Expand a set row — only one can be expanded at a time (UI-SPEC.md rule).
  // Passing null collapses all.
  setExpanded: (setId) => set({ expandedSetId: setId }),

  // Mark a set as focused (keyboard open on WeightInput)
  setFocused: (setId) => set({ focusedSetId: setId }),

  // Add a new set to an exercise, pre-filling weight from the last set
  addSet: (exerciseId) =>
    set((state) => {
      const exercises = state.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetState = {
          id: generateUUID(),
          setNumber: (lastSet?.setNumber ?? 0) + 1,
          weightKg: lastSet?.weightKg ?? null, // pre-fill from last set
          result: null,
          rpe: null,
          isWarmup: false,
          notes: null,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { exercises };
    }),

  // Swap an exercise at a specific slot index (Plan 08 wires the UI; stub for Plan 04)
  swapExercise: (slotIndex, newExercise) =>
    set((state) => {
      const exercises = [...state.exercises];
      if (slotIndex >= 0 && slotIndex < exercises.length) {
        exercises[slotIndex] = newExercise;
      }
      return { exercises };
    }),

  // Return current state accessor (useful for service layer without subscribing)
  // getState() is provided by Zustand automatically
}));

// Re-export types for consumers
export type { SetResult };

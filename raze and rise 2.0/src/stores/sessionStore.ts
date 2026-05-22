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
 *   exercises[]              — ordered array of ExerciseState (loaded from today's template)
 *   expandedSetId            — only ONE set can be expanded at a time (UI-SPEC.md rule)
 *   focusedSetId             — which set has keyboard focus (WeightInput)
 *   flashListRef             — ref to the FlashList for superset auto-scroll (Plan 06)
 *   supersetCursor           — tracks which arm/set is active in a superset (Plan 06)
 *   dismissedOverloadHints   — Record<exerciseId, boolean> for per-session overload hint dismissal (Plan 08)
 *   swapModalForExerciseId   — exerciseId currently showing the swap modal, or null (Plan 08)
 *   noteSheetOpen            — whether the session note sheet is visible (Plan 08)
 *   sessionNotes             — session-level free text note, persisted to MMKV (Plan 08)
 *   soreMuscles              — array of muscle IDs flagged as sore on the body map (Plan 09)
 *
 * Actions:
 *   loadExercises           — replace the exercises array (called once on session init)
 *   setSetResult            — mark a set go / no-go / null
 *   setSetWeight            — update weight for a set
 *   setSetRpe               — update RPE (1-10) for a set
 *   setSetWarmup            — toggle warm-up flag for a set
 *   setSetNotes             — update notes for a set
 *   setExpanded             — expand one set row, collapsing any previously expanded one
 *   setFocused              — mark which set has keyboard focus
 *   addSet                  — append a new set to an exercise (pre-fills weight from last set)
 *   swapExercise            — replace exercise at a given slot index (Plan 08 wires the UI)
 *   dismissOverloadHint     — mark an exercise's overload hint as dismissed for this session (Plan 08)
 *   openSwapModal           — open the exercise swap modal for an exerciseId (Plan 08)
 *   closeSwapModal          — close the exercise swap modal (Plan 08)
 *   openNoteSheet           — open the session note sheet (Plan 08)
 *   closeNoteSheet          — close the session note sheet (Plan 08)
 *   setSessionNotes         — update the session notes string (Plan 08)
 *   toggleMuscle            — toggle a muscle ID in soreMuscles (Plan 09)
 *   setSoreMuscles          — replace the entire soreMuscles array (Plan 09)
 *   setListRef              — register the FlashList ref for superset scroll (Plan 06)
 *   scrollToExerciseId      — scroll FlashList to the item containing exerciseId (Pitfall 8)
 *   advanceSupersetCursor   — update the superset cursor after a set commit (Plan 06)
 */

import { create } from 'zustand';
import { FlashListRef } from '@shopify/flash-list';
import { SetResult } from '@/hooks/useSetResult';
import {
  buildFlashListData,
  findFlashListIndexForExercise,
  FlashListItem,
} from '@/lib/supersetLogic';

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

/** Tracks which arm + set is currently active during a superset (Plan 06) */
export interface SupersetCursor {
  groupId: number;
  arm: 'A' | 'B';
  setNumber: number;
}

interface SessionState {
  exercises: ExerciseState[];
  expandedSetId: string | null;
  focusedSetId: string | null;
  /** FlashList ref for superset auto-scroll (Plan 06) — stored at module scope to avoid Zustand serialization issues */
  flashListRef: FlashListRef<FlashListItem> | null;
  /** Current superset cursor — tracks which arm/set is active */
  supersetCursor: SupersetCursor | null;

  // ── Plan 08: Progressive overload hint dismissal ──────────────────────
  /** Record<exerciseId, boolean> — tracks which exercise overload hints have been dismissed this session */
  dismissedOverloadHints: Record<string, boolean>;

  // ── Plan 08: Exercise swap modal ──────────────────────────────────────
  /** exerciseId for which the swap modal is currently open, or null if closed */
  swapModalForExerciseId: string | null;

  // ── Plan 08: Session note sheet ───────────────────────────────────────
  /** Whether the session note bottom sheet is open */
  noteSheetOpen: boolean;
  /** Free-text session notes, persisted to MMKV via useSessionPersistence (Plan 08) */
  sessionNotes: string;

  // ── Plan 09: Body map sore muscle tracking ────────────────────────────
  /** Array of muscle IDs flagged as sore on the body map (Plan 09 — WORKOUT-10) */
  soreMuscles: string[];

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
  /**
   * swapExercise — replace the exercise at slotIndex with a new exercise.
   *
   * Preserves the existing sets array so previously-entered weight/result data
   * is retained under the new exercise. Only exerciseId and exerciseName are updated.
   * This is a Zustand-only action — no write to template_exercises table (T-02-12).
   * completeSession will write session_sets rows with the swapped exerciseId.
   *
   * @param slotIndex - 0-based index in the exercises array
   * @param newExercise - { id, name } of the replacement exercise from the library
   */
  swapExercise: (slotIndex: number, newExercise: { id: string; name: string }) => void;
  /** Dismiss the progressive overload hint for a specific exercise (per-session) */
  dismissOverloadHint: (exerciseId: string) => void;
  /** Open the exercise swap modal for a specific exerciseId */
  openSwapModal: (exerciseId: string) => void;
  /** Close the exercise swap modal */
  closeSwapModal: () => void;
  /** Open the session note bottom sheet */
  openNoteSheet: () => void;
  /** Close the session note bottom sheet */
  closeNoteSheet: () => void;
  /** Update the session-level notes string */
  setSessionNotes: (notes: string) => void;
  /**
   * Toggle a muscle ID in soreMuscles.
   * If the ID is already present → remove it. If absent → add it.
   * Fires from BodyMap taps (Plan 09 — WORKOUT-10).
   */
  toggleMuscle: (muscleId: string) => void;
  /** Replace the entire soreMuscles array (e.g. on session init) */
  setSoreMuscles: (ids: string[]) => void;
  /** Register the FlashList ref for superset auto-scroll (called from SessionScreen) */
  setListRef: (ref: FlashListRef<FlashListItem> | null) => void;
  /**
   * Scroll the FlashList to the item containing exerciseId.
   * Uses findFlashListIndexForExercise (Pitfall 8 — never uses raw exercise array index).
   * Guards against -1 (T-02-09).
   */
  scrollToExerciseId: (exerciseId: string) => void;
  /** Update the superset cursor after a set commit */
  advanceSupersetCursor: (cursor: SupersetCursor | null) => void;
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
  flashListRef: null,
  supersetCursor: null,
  dismissedOverloadHints: {},
  swapModalForExerciseId: null,
  noteSheetOpen: false,
  sessionNotes: '',
  soreMuscles: [],

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

  // Swap an exercise at a specific slot index (Plan 08).
  // Preserves existing sets — only exerciseId and exerciseName are updated.
  // This is a Zustand-only action: never writes to template_exercises (T-02-12).
  swapExercise: (slotIndex, newExercise) =>
    set((state) => {
      const exercises = [...state.exercises];
      if (slotIndex >= 0 && slotIndex < exercises.length) {
        const current = exercises[slotIndex];
        exercises[slotIndex] = {
          ...current,
          exerciseId: newExercise.id,
          exerciseName: newExercise.name,
          // sets array preserved — user keeps previously-entered weight/result entries
        };
      }
      return { exercises };
    }),

  // Dismiss the progressive overload hint for this exercise (per-session)
  dismissOverloadHint: (exerciseId) =>
    set((state) => ({
      dismissedOverloadHints: { ...state.dismissedOverloadHints, [exerciseId]: true },
    })),

  // Open the exercise swap modal for a specific exerciseId
  openSwapModal: (exerciseId) => set({ swapModalForExerciseId: exerciseId }),

  // Close the exercise swap modal
  closeSwapModal: () => set({ swapModalForExerciseId: null }),

  // Open the session note bottom sheet
  openNoteSheet: () => set({ noteSheetOpen: true }),

  // Close the session note bottom sheet
  closeNoteSheet: () => set({ noteSheetOpen: false }),

  // Update the session-level notes string
  setSessionNotes: (notes) => set({ sessionNotes: notes }),

  // Toggle a muscle ID in soreMuscles (Plan 09 — WORKOUT-10)
  // Adds if absent, removes if present. Immutable update.
  toggleMuscle: (muscleId) =>
    set((state) => {
      const already = state.soreMuscles.includes(muscleId);
      return {
        soreMuscles: already
          ? state.soreMuscles.filter((id) => id !== muscleId)
          : [...state.soreMuscles, muscleId],
      };
    }),

  // Replace the entire soreMuscles array
  setSoreMuscles: (ids) => set({ soreMuscles: ids }),

  // ── Plan 06: Superset auto-scroll ─────────────────────────────────────

  // Register the FlashList ref — called from SessionScreen after FlashList mounts
  setListRef: (ref) => set({ flashListRef: ref }),

  // Scroll FlashList to the item containing exerciseId.
  // Uses findFlashListIndexForExercise (RESEARCH.md Pitfall 8 — never raw array index).
  // Guards against -1 return value (T-02-09 — unknown exerciseId is a no-op).
  scrollToExerciseId: (exerciseId) => {
    const state = get();
    const data = buildFlashListData(state.exercises);
    const index = findFlashListIndexForExercise(data, exerciseId);
    if (index < 0) {
      // Unknown exerciseId — no-op (T-02-09 mitigation)
      return;
    }
    state.flashListRef?.scrollToIndex({ index, animated: true });
  },

  // Update the superset cursor (or clear it with null when superset is finished)
  advanceSupersetCursor: (cursor) => set({ supersetCursor: cursor }),

  // Return current state accessor (useful for service layer without subscribing)
  // getState() is provided by Zustand automatically
}));

// Re-export types for consumers
export type { SetResult };

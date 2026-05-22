/**
 * supersetLogic — pure state machine for superset pairing (WORKOUT-11).
 *
 * Keeps all superset logic unit-testable and decoupled from React/FlashList.
 *
 * Exports:
 *   - SetRowState            Type for a set row with its result
 *   - supersetRoundComplete  True only when BOTH arms have a non-null result at setNumber
 *   - SupersetTarget         Return type for nextSupersetTarget
 *   - nextSupersetTarget     Next scroll target after a set commit on A or B
 *   - FlashListItem          Union type for the FlashList data array
 *   - buildFlashListData     Converts raw exercises array to FlashList data (deduped pairs)
 *   - findFlashListIndexForExercise  Resolves exerciseId → FlashList data array index (Pitfall 8)
 *
 * Threat model:
 *   T-02-08: supersetRoundComplete called with mismatched setNumber → find() returns
 *            undefined; Boolean(undefined?.result) short-circuits to false. Safe.
 *   T-02-09: findFlashListIndexForExercise called with unknown id → returns -1; callers
 *            must guard against -1 before calling FlashList.scrollToIndex.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SetRowState {
  setNumber: number;
  result: 'go' | 'no-go' | null;
}

export interface SupersetTarget {
  exerciseLetter: 'A' | 'B';
  setNumber: number;
}

export type FlashListItem =
  | { type: 'single'; exerciseId: string }
  | { type: 'superset-pair'; exerciseAId: string; exerciseBId: string; groupId: number };

// ── supersetRoundComplete ─────────────────────────────────────────────────────

/**
 * Returns true when BOTH arms have a non-null result at the given setNumber.
 *
 * False cases:
 *   - Only A has a result  → false
 *   - Only B has a result  → false
 *   - Neither has a result → false
 *   - setNumber not found in either array → false
 *   - Mismatched set numbers (A has set 1, B has set 2 at setNumber=1) → false
 */
export function supersetRoundComplete(
  setsA: SetRowState[],
  setsB: SetRowState[],
  setNumber: number,
): boolean {
  const a = setsA.find((s) => s.setNumber === setNumber);
  const b = setsB.find((s) => s.setNumber === setNumber);
  return Boolean(a?.result && b?.result);
}

// ── nextSupersetTarget ────────────────────────────────────────────────────────

/**
 * Resolve the next scroll target after a set commit in a superset.
 *
 *   A → B at same setNumber (always move to paired arm)
 *   B → A at setNumber + 1 if round is complete AND setNumber < maxSets
 *   B → null if round is complete AND setNumber === maxSets (superset finished)
 *   B → A at same setNumber if round is NOT complete (A hasn't been committed yet)
 */
export function nextSupersetTarget(
  currentArm: 'A' | 'B',
  currentSetNumber: number,
  setsA: SetRowState[],
  setsB: SetRowState[],
  maxSets: number,
): SupersetTarget | null {
  if (currentArm === 'A') {
    // Always move to B at the same set number to complete the round
    return { exerciseLetter: 'B', setNumber: currentSetNumber };
  }

  // currentArm === 'B'
  const roundComplete = supersetRoundComplete(setsA, setsB, currentSetNumber);

  if (!roundComplete) {
    // B has committed but A hasn't for this set — go back to A at same set
    return { exerciseLetter: 'A', setNumber: currentSetNumber };
  }

  // Round complete
  if (currentSetNumber >= maxSets) {
    // All sets done — superset finished
    return null;
  }

  // Move to A for the next set pair
  return { exerciseLetter: 'A', setNumber: currentSetNumber + 1 };
}

// ── buildFlashListData ────────────────────────────────────────────────────────

/**
 * Convert an ordered exercises array into the FlashList data array.
 *
 * Rules:
 *   - Exercises with supersetGroup === null → { type: 'single', exerciseId }
 *   - The FIRST exercise of a superset group (seen in order) and its partner →
 *     one { type: 'superset-pair', exerciseAId, exerciseBId, groupId } item
 *   - The second exercise of the pair is SKIPPED (already represented in the pair item)
 *   - An orphan superset exercise (no partner found later in the array) → type: 'single'
 *
 * This guarantees each superset group appears exactly once in the FlashList data
 * array, which is required for correct scrollToIndex resolution (RESEARCH.md Pitfall 8).
 */
export function buildFlashListData(
  exercises: Array<{ id: string; supersetGroup: number | null }>,
): FlashListItem[] {
  const out: FlashListItem[] = [];
  const seenGroups = new Set<number>();

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];

    if (ex.supersetGroup == null) {
      // Not in a superset — render as single
      out.push({ type: 'single', exerciseId: ex.id });
    } else if (seenGroups.has(ex.supersetGroup)) {
      // This is the second (or later) exercise in a pair — already emitted via the pair item
      // Skip it; the pair container handles rendering both ExerciseCards
    } else {
      // First exercise in this group — look for a partner later in the array
      const partner = exercises.find(
        (e, j) => j > i && e.supersetGroup === ex.supersetGroup,
      );

      if (partner) {
        out.push({
          type: 'superset-pair',
          exerciseAId: ex.id,
          exerciseBId: partner.id,
          groupId: ex.supersetGroup,
        });
        seenGroups.add(ex.supersetGroup);
      } else {
        // Orphan — no partner found; render as single to avoid dropping the exercise
        out.push({ type: 'single', exerciseId: ex.id });
      }
    }
  }

  return out;
}

// ── findFlashListIndexForExercise ─────────────────────────────────────────────

/**
 * Resolve an exercise id to its index in the FlashList data array.
 *
 * For single items: matches exerciseId directly.
 * For superset-pair items: matches either exerciseAId OR exerciseBId.
 * Both A and B resolve to the SAME pair item index — scrolling to the pair
 * container is the correct target (ExerciseCard for B is rendered inside the pair).
 *
 * Returns -1 if not found (caller must guard: `if (index < 0) return`).
 * T-02-09: callers must NOT pass -1 to FlashList.scrollToIndex.
 */
export function findFlashListIndexForExercise(
  data: FlashListItem[],
  exerciseId: string,
): number {
  return data.findIndex((item) =>
    item.type === 'single'
      ? item.exerciseId === exerciseId
      : item.exerciseAId === exerciseId || item.exerciseBId === exerciseId,
  );
}

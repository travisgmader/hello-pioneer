/**
 * sessionStats — pure stat helpers for the active session.
 *
 * No PowerSync coupling — pure functions over plain arrays.
 * Used by: go-rate display (WORKOUT-05), progressive overload hint (Plan 08).
 *
 * WORKOUT-05 contract:
 *   Warm-up sets are excluded from BOTH the numerator and denominator of go-rate.
 *   Incomplete sets (result === null) are excluded from the denominator.
 *   Only completed working sets count toward the go-rate percentage.
 *
 * T-02-05 mitigation: computeGoRate handles empty arrays and zero-working-set
 * inputs without divide-by-zero (returns 0).
 */

export interface SetRowForStats {
  result: 'go' | 'no-go' | null;
  is_warmup: boolean;
}

/**
 * computeWorkingSetCount — returns the count of non-warmup sets.
 *
 * Used by ExerciseCard to display the working set tally.
 * Warmup sets do not count toward the set count displayed to the user.
 */
export function computeWorkingSetCount(sets: SetRowForStats[]): number {
  return sets.filter((s) => !s.is_warmup).length;
}

/**
 * computeGoRate — percentage of completed working sets that were marked 'go'.
 *
 * Excludes:
 *   - Warmup sets (is_warmup === true) from BOTH numerator and denominator
 *   - Incomplete sets (result === null) from the denominator
 *
 * Returns 0 for empty arrays or when no working sets have been completed.
 * Returns a rounded-to-2-decimal percentage (e.g. 66.67, not 0.6667).
 *
 * WORKOUT-05 acceptance: warm-up exclusion ensures that a user who logs 3 warm-up
 * sets and 0 working sets sees 0% rather than a misleadingly high figure.
 */
export function computeGoRate(sets: SetRowForStats[]): number {
  const working = sets.filter((s) => !s.is_warmup && s.result !== null);
  if (working.length === 0) return 0;
  const goCount = working.filter((s) => s.result === 'go').length;
  return Math.round((goCount / working.length) * 10000) / 100;
}

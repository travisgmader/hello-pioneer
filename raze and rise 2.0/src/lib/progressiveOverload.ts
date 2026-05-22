/**
 * progressiveOverload — pure predicate for the progressive overload hint (WORKOUT-14).
 *
 * No PowerSync coupling — pure function over plain arrays.
 * Used by: ProgressiveOverloadHint component (Plan 08).
 *
 * Weight comparison uses EXACT equality.
 *
 * Caller responsibility: weights must be rounded consistently to typical lifting increments
 * (minimum 1.25 kg). PowerSync stores weight_kg as REAL; floating-point drift should not
 * exceed lift precision when both the previous session and the current prefill come from
 * the same stored value.
 *
 * Filtering logic:
 *   1. Exclude warm-up sets (is_warmup === true) — they are practice reps, not performance signal.
 *   2. Exclude null-result sets (result === null) — incomplete sets carry no information.
 *   3. Exclude sets at a different weight — user may have changed the weight, and the hint
 *      is only relevant for the current weight being attempted.
 *   4. If no candidates remain → false (no signal).
 *   5. Return true only when ALL remaining candidates are 'go'.
 */

import type { SetRowForStats } from './sessionStats';

export interface SetRowWithWeight extends SetRowForStats {
  weight_kg: number | null;
}

/**
 * shouldShowOverloadHint — returns true when the previous session suggests
 * the user is ready to increase weight.
 *
 * Returns true iff:
 *   - There is at least ONE non-warmup, completed (non-null result) set at currentWeightKg
 *   - ALL such sets were 'go' (none were 'no-go')
 *
 * @param previousSets - Array of set rows from the previous completed session.
 *   Each row must include `result`, `is_warmup`, and `weight_kg`.
 * @param currentWeightKg - The weight the user is about to lift (from the prefilled set row).
 *   Must use the same unit and rounding as values stored in previousSets.
 */
export function shouldShowOverloadHint(
  previousSets: SetRowWithWeight[],
  currentWeightKg: number,
): boolean {
  // Filter to: working sets (not warm-up) + completed (result not null) + same weight
  const candidates = previousSets.filter(
    (s) => !s.is_warmup && s.result !== null && s.weight_kg === currentWeightKg,
  );

  // No signal: no completed working sets at this weight in the previous session
  if (candidates.length === 0) return false;

  // Show hint only when ALL candidates were 'go' — any 'no-go' suppresses the hint
  return candidates.every((s) => s.result === 'go');
}

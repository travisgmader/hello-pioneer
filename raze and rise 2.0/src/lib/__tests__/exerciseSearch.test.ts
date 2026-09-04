/**
 * filterExercises — TEMPLATE-02 (RED scaffold, Wave 0)
 *
 * `src/lib/exerciseSearch.ts` ships in plan 03-02. This suite is written first
 * and is EXPECTED TO FAIL with a module-resolution error until it does.
 *
 * Contract this suite pins down:
 *   - Pure function over plain exercise rows. No PowerSync coupling.
 *   - The muscle column is `muscle_group`. It is NOT `primary_muscle` —
 *     ExerciseSwapModal:98 has that latent bug and PowerSync silently returns
 *     undefined for the undeclared column (verified: initial_schema.sql:54,
 *     schema.ts exercisesTable). Do not carry the bug forward.
 *   - Name match is case-insensitive substring ("LIKE %q%" semantics).
 *   - Muscle filter 'All' is a pass-through.
 *   - Custom exercises (is_custom = 1) are visible ONLY to their creator —
 *     this mirrors the exercises_select_visible RLS policy client-side so the
 *     list does not flash rows the server would refuse.
 */

import { describe, it, expect } from 'vitest';
import { filterExercises } from '@/lib/exerciseSearch';

/** Minimal row shape — mirrors the exercises columns the search query selects. */
interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  is_custom: number;
  created_by: string | null;
}

const USER = 'user-a';
const OTHER = 'user-b';

const rows: ExerciseRow[] = [
  { id: '1', name: 'Barbell Bench Press', muscle_group: 'Chest', is_custom: 0, created_by: null },
  { id: '2', name: 'Incline Dumbbell Press', muscle_group: 'Chest', is_custom: 0, created_by: null },
  { id: '3', name: 'Barbell Row', muscle_group: 'Back', is_custom: 0, created_by: null },
  { id: '4', name: 'Back Squat', muscle_group: 'Legs', is_custom: 0, created_by: null },
  { id: '5', name: 'My Cable Press', muscle_group: 'Chest', is_custom: 1, created_by: USER },
  { id: '6', name: 'Their Secret Press', muscle_group: 'Chest', is_custom: 1, created_by: OTHER },
];

const ids = (result: ExerciseRow[]) => result.map((r) => r.id);

describe('filterExercises — name query', () => {
  it("matches name as a case-insensitive substring", () => {
    expect(ids(filterExercises(rows, 'barbell', 'All', USER))).toEqual(['1', '3']);
  });

  it('returns everything visible for an empty query', () => {
    expect(ids(filterExercises(rows, '', 'All', USER))).toEqual(['1', '2', '3', '4', '5']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterExercises(rows, 'zzzz', 'All', USER)).toEqual([]);
  });
});

describe('filterExercises — muscle_group filter', () => {
  it('filters by muscle_group', () => {
    expect(ids(filterExercises(rows, '', 'Back', USER))).toEqual(['3']);
  });

  it("treats 'All' as a pass-through", () => {
    expect(filterExercises(rows, '', 'All', USER)).toHaveLength(5);
  });

  it('combines the name query and the muscle filter', () => {
    expect(ids(filterExercises(rows, 'press', 'Chest', USER))).toEqual(['1', '2', '5']);
  });
});

describe('filterExercises — custom exercise scoping', () => {
  it('includes the calling user’s own custom exercises', () => {
    expect(ids(filterExercises(rows, 'cable', 'All', USER))).toEqual(['5']);
  });

  it('excludes custom exercises created by another user', () => {
    expect(ids(filterExercises(rows, 'secret', 'All', USER))).toEqual([]);
  });

  it('shows only built-in exercises when there is no user id', () => {
    expect(ids(filterExercises(rows, '', 'All', ''))).toEqual(['1', '2', '3', '4']);
  });
});

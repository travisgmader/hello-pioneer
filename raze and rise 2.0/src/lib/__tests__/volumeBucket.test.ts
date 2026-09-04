/**
 * bucketVolumeByWeek — PROGRESS-03 (RED scaffold, Wave 0)
 *
 * `src/lib/volumeBucket.ts` ships in plan 03-04. This suite is written first
 * and is EXPECTED TO FAIL with a module-resolution error until it does.
 *
 * Contract this suite pins down:
 *   - Pure function over plain session_sets rows. No PowerSync coupling.
 *   - Volume per set = weight_kg * reps_target.
 *   - Rows are bucketed by startOfISOWeek(logged_at); the bucket key is the
 *     ISO date of that Monday (YYYY-MM-DD).
 *   - Warmup sets are filtered UPSTREAM by the SQL query — this helper does NOT
 *     re-filter them, so callers must never pass warmups in.
 *   - Null weight_kg / reps_target contribute 0, never NaN.
 *   - Output is sorted ascending by week so it feeds Victory's x-axis directly.
 */

import { describe, it, expect } from 'vitest';
import { bucketVolumeByWeek } from '@/lib/volumeBucket';

/** Minimal row shape — mirrors the session_sets columns the chart query selects. */
interface VolumeRow {
  logged_at: string;
  weight_kg: number | null;
  reps_target: number | null;
}

const row = (logged_at: string, weight_kg: number | null, reps_target: number | null): VolumeRow => ({
  logged_at,
  weight_kg,
  reps_target,
});

describe('bucketVolumeByWeek', () => {
  it('returns an empty array for no rows', () => {
    expect(bucketVolumeByWeek([])).toEqual([]);
  });

  it('multiplies weight_kg by reps_target for a single set', () => {
    const result = bucketVolumeByWeek([row('2026-06-10T18:00:00.000Z', 100, 5)]);
    expect(result).toHaveLength(1);
    expect(result[0].volumeKg).toBe(500);
  });

  it('sums every set that falls in the same ISO week', () => {
    // 2026-06-08 (Mon) .. 2026-06-14 (Sun) is one ISO week.
    const result = bucketVolumeByWeek([
      row('2026-06-08T18:00:00.000Z', 100, 5), // 500
      row('2026-06-10T18:00:00.000Z', 60, 10), // 600
      row('2026-06-14T18:00:00.000Z', 80, 5), //  400
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].volumeKg).toBe(1500);
  });

  it('keys each bucket by the ISO week start (Monday)', () => {
    const result = bucketVolumeByWeek([row('2026-06-10T18:00:00.000Z', 100, 5)]);
    expect(result[0].weekStart).toBe('2026-06-08');
  });

  it('splits sets across separate ISO weeks and sorts ascending', () => {
    const result = bucketVolumeByWeek([
      row('2026-06-16T18:00:00.000Z', 100, 5), // week of 06-15 → 500
      row('2026-06-10T18:00:00.000Z', 100, 5), // week of 06-08 → 500
    ]);
    expect(result.map((b) => b.weekStart)).toEqual(['2026-06-08', '2026-06-15']);
  });

  it('treats null weight or reps as zero volume, never NaN', () => {
    const result = bucketVolumeByWeek([
      row('2026-06-10T18:00:00.000Z', null, 5),
      row('2026-06-10T18:00:00.000Z', 100, null),
      row('2026-06-10T18:00:00.000Z', 100, 5),
    ]);
    expect(result[0].volumeKg).toBe(500);
  });

  it('does NOT re-filter warmups — callers filter them in SQL', () => {
    // Both rows are counted: this helper is intentionally warmup-agnostic.
    const result = bucketVolumeByWeek([
      row('2026-06-10T18:00:00.000Z', 100, 5),
      row('2026-06-10T18:00:00.000Z', 20, 10),
    ]);
    expect(result[0].volumeKg).toBe(700);
  });
});

/**
 * computeStreak — GAMIFY-03 (RED scaffold, Wave 0)
 *
 * `src/lib/streak.ts` ships in plan 03-03. This suite is written first and is
 * EXPECTED TO FAIL with a module-resolution error until it does.
 *
 * Contract this suite pins down:
 *   - Pure function over an array of ISO date strings (the distinct
 *     sessions.completed_at values). No PowerSync coupling — same shape as
 *     src/lib/sessionStats.ts.
 *   - A "streak" is consecutive ISO WEEKS containing at least one completed
 *     session, counted backwards from the most recent week.
 *   - Multiple sessions in one week count once.
 *   - A gap week breaks the streak; only the run ending at the latest week counts.
 *
 * Dates below are ISO Mondays so the ISO-week boundaries are unambiguous:
 *   2026-06-01 / 06-08 / 06-15 / 06-22 are four consecutive ISO weeks.
 */

import { describe, it, expect } from 'vitest';
import { computeStreak } from '@/lib/streak';

describe('computeStreak', () => {
  it('returns 0 for an empty array', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 1 for a single session', () => {
    expect(computeStreak(['2026-06-15T18:00:00.000Z'])).toBe(1);
  });

  it('increments across consecutive ISO weeks', () => {
    const dates = [
      '2026-06-01T18:00:00.000Z',
      '2026-06-08T18:00:00.000Z',
      '2026-06-15T18:00:00.000Z',
    ];
    expect(computeStreak(dates)).toBe(3);
  });

  it('counts a week once even with several sessions in it', () => {
    const dates = [
      '2026-06-08T18:00:00.000Z',
      '2026-06-09T18:00:00.000Z',
      '2026-06-11T18:00:00.000Z',
      '2026-06-15T18:00:00.000Z',
    ];
    expect(computeStreak(dates)).toBe(2);
  });

  it('breaks the streak on a skipped week and counts only the latest run', () => {
    const dates = [
      '2026-06-01T18:00:00.000Z', // week 1
      // week 2 skipped
      '2026-06-15T18:00:00.000Z', // week 3
      '2026-06-22T18:00:00.000Z', // week 4
    ];
    expect(computeStreak(dates)).toBe(2);
  });

  it('is order-independent — unsorted input yields the same streak', () => {
    const dates = [
      '2026-06-15T18:00:00.000Z',
      '2026-06-01T18:00:00.000Z',
      '2026-06-08T18:00:00.000Z',
    ];
    expect(computeStreak(dates)).toBe(3);
  });
});

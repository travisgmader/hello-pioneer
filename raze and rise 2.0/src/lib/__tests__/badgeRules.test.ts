/**
 * badgeRules — GAMIFY-01 (RED scaffold, Wave 0)
 *
 * `src/lib/badgeRules.ts` ships in plan 03-06. This suite is written first and
 * is EXPECTED TO FAIL with a module-resolution error until it does.
 *
 * Contract this suite pins down (RESEARCH Pattern 8):
 *   - Pure function. Callers pass the *already-computed* running counters from
 *     public.user_stats; badgeRules NEVER scans session history itself, because
 *     detection runs inside completeSession's writeTransaction on every session.
 *   - Threshold detection is edge-triggered: a badge unlocks on the session that
 *     CROSSES the threshold, not on every session at or above it.
 *   - Already-owned badges are never re-emitted, so the caller's
 *     `INSERT ... ON CONFLICT (user_id, badge_key) DO NOTHING` stays a no-op.
 */

import { describe, it, expect } from 'vitest';
import { detectNewBadges } from '@/lib/badgeRules';

/** Shape of the counters handed to detectNewBadges — mirrors public.user_stats. */
interface Stats {
  totalSessions: number;
  currentStreakWeeks: number;
  hitPrThisSession: boolean;
}

const stats = (over: Partial<Stats> = {}): Stats => ({
  totalSessions: 0,
  currentStreakWeeks: 0,
  hitPrThisSession: false,
  ...over,
});

describe('detectNewBadges — century (100 sessions)', () => {
  it("unlocks 'century' on the session that crosses 100", () => {
    const unlocked = detectNewBadges(stats({ totalSessions: 100 }), []);
    expect(unlocked).toContain('century');
  });

  it("does not unlock 'century' at 99 sessions", () => {
    const unlocked = detectNewBadges(stats({ totalSessions: 99 }), []);
    expect(unlocked).not.toContain('century');
  });
});

describe('detectNewBadges — on_fire (30-day streak)', () => {
  it("unlocks 'on_fire' when the streak reaches 30 days", () => {
    const unlocked = detectNewBadges(stats({ currentStreakWeeks: 30 }), []);
    expect(unlocked).toContain('on_fire');
  });

  it("does not unlock 'on_fire' below the threshold", () => {
    const unlocked = detectNewBadges(stats({ currentStreakWeeks: 29 }), []);
    expect(unlocked).not.toContain('on_fire');
  });
});

describe('detectNewBadges — personal_record (first PR)', () => {
  it("unlocks 'personal_record' the first time a PR is hit", () => {
    const unlocked = detectNewBadges(stats({ hitPrThisSession: true }), []);
    expect(unlocked).toContain('personal_record');
  });

  it("does not unlock 'personal_record' on a session with no PR", () => {
    const unlocked = detectNewBadges(stats({ hitPrThisSession: false }), []);
    expect(unlocked).not.toContain('personal_record');
  });
});

describe('detectNewBadges — no double unlock', () => {
  it('never re-emits a badge the user already owns', () => {
    const unlocked = detectNewBadges(
      stats({ totalSessions: 150, currentStreakWeeks: 40, hitPrThisSession: true }),
      ['century', 'on_fire', 'personal_record'],
    );
    expect(unlocked).toEqual([]);
  });

  it('emits only the badges not already owned', () => {
    const unlocked = detectNewBadges(
      stats({ totalSessions: 150, currentStreakWeeks: 40 }),
      ['century'],
    );
    expect(unlocked).toContain('on_fire');
    expect(unlocked).not.toContain('century');
  });

  it('returns an empty array when nothing crossed a threshold', () => {
    expect(detectNewBadges(stats(), [])).toEqual([]);
  });
});

/**
 * GREEN tests for computeTrialEnd (ARCH-13).
 *
 * Validates DST-safe 7-calendar-day addition via Luxon.
 * Replaced the Wave 0 RED stub that was in this file before Plan 05.
 */
import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { computeTrialEnd } from '../../src/lib/trialEnd';

describe('computeTrialEnd', () => {
  it('returns DateTime exactly 7 calendar days later', () => {
    const input = DateTime.fromISO('2026-05-19T12:00:00', { zone: 'America/Chicago' });
    const result = computeTrialEnd(input);
    const expected = DateTime.fromISO('2026-05-26T12:00:00', { zone: 'America/Chicago' });
    expect(result.toISO()).toEqual(expected.toISO());
  });

  it('is DST-safe across spring forward (America/Chicago 2026-03-08)', () => {
    // Spring forward: clocks move from 2:00 AM → 3:00 AM on 2026-03-08.
    // 7 × 24 h would give 2026-03-15T13:00:00 (one hour drift).
    // Calendar-day arithmetic gives 2026-03-15T12:00:00 (correct).
    const input = DateTime.fromISO('2026-03-08T12:00:00', { zone: 'America/Chicago' });
    const result = computeTrialEnd(input);
    expect(result.day).toEqual(15);
    expect(result.hour).toEqual(12);
  });

  it('preserves the input timezone', () => {
    const input = DateTime.fromISO('2026-06-01T10:00:00', { zone: 'Europe/Berlin' });
    const result = computeTrialEnd(input);
    expect(result.zoneName).toEqual('Europe/Berlin');
  });
});

/**
 * Wave 0 RED stub — ARCH-13 (Luxon date math keyed to family_settings.timezone).
 *
 * The computeTrialEnd helper is created in Plan 05. Until then this test
 * MUST fail at import time. Asserts that adding 7 days survives the
 * America/Chicago spring DST transition without drifting to UTC.
 */
import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
// @ts-expect-error — module is created in Plan 05
import { computeTrialEnd } from '../../src/lib/trialEnd';

describe('computeTrialEnd (Wave 0 RED stub — created in Plan 05)', () => {
  it('adds 7 days in the supplied zone, DST-safe', () => {
    const start = DateTime.fromISO('2026-05-19T12:00:00', {
      zone: 'America/Chicago',
    });
    const end = computeTrialEnd(start);
    expect(end.zoneName).toBe('America/Chicago');
    expect(end.diff(start, 'days').days).toBe(7);
  });
});

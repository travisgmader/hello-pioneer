import { DateTime } from 'luxon';

/**
 * Compute the trial end date as 7 calendar days after `now`.
 *
 * DST-safety rationale (ARCH-13):
 * Luxon's `plus({ days: N })` performs calendar-day arithmetic, NOT
 * 7 × 24 hours. This means that across daylight-saving transitions
 * (e.g. America/Chicago spring-forward at 2:00 AM on March 8 2026) the
 * returned DateTime is still exactly 7 calendar days later at the same
 * wall-clock hour — not 7 × 24 = 168 hours later, which would drift by
 * the DST offset (1 hour). The input timezone is preserved on the result.
 *
 * @param now - The start DateTime (any zone). Typically `DateTime.now().setZone(browserTz)`.
 * @returns A new DateTime exactly 7 calendar days after `now`, in the same zone.
 */
export function computeTrialEnd(now: DateTime): DateTime {
  return now.plus({ days: 7 });
}

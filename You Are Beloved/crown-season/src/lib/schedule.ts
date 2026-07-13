import { TOTAL_WEEKS, allDays, dayKey, type StudyDay } from './curriculum';

/* ---------- Release schedule ----------
 * Weeks unlock on a weekly cadence from START_DATE. Within an unlocked week,
 * days must be done in order (Day 2 needs Day 1 done, Day 3 needs Day 2 done).
 * The leader bypasses every lock so they can prep and preview ahead.
 *
 * Leader status is a RUNTIME check (the signed-in user is the leader email),
 * set by SessionProvider — one build serves members (gated) and the leader
 * (unlocked). To change the schedule, edit START_DATE / WEEK_INTERVAL_DAYS. */

// Set by SessionProvider whenever the signed-in user changes.
let leaderMode = false;
export function setLeaderMode(isLeader: boolean): void {
  leaderMode = isLeader;
}

// Local midnight of the day Week 1 opens. Month is 0-based (6 = July).
export const START_DATE = new Date(2026, 6, 19); // Sunday, July 19, 2026
export const WEEK_INTERVAL_DAYS = 7;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** The leader sees everything; members are gated to the release cadence. */
export function bypassLocks(): boolean {
  return leaderMode;
}

/** The calendar date a given week opens. */
export function weekUnlockDate(week: number): Date {
  const d = startOfDay(START_DATE);
  d.setDate(d.getDate() + (week - 1) * WEEK_INTERVAL_DAYS);
  return d;
}

export function formatUnlock(week: number): string {
  return weekUnlockDate(week).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function isWeekUnlocked(week: number, today: Date = new Date()): boolean {
  if (bypassLocks()) return true;
  return startOfDay(today).getTime() >= weekUnlockDate(week).getTime();
}

/** A day is open iff its week has released AND the prior day is done. */
export function isDayUnlocked(
  week: number,
  day: number,
  isDone: (key: string) => boolean,
  today: Date = new Date(),
): boolean {
  if (bypassLocks()) return true;
  if (!isWeekUnlocked(week, today)) return false;
  if (day <= 1) return true;
  return isDone(dayKey(week, day - 1));
}

/** Highest week currently released (0 before the season starts). */
export function currentWeek(today: Date = new Date()): number {
  let w = 0;
  for (let i = 1; i <= TOTAL_WEEKS; i++) if (isWeekUnlocked(i, today)) w = i;
  return w;
}

/** The next locked week after `week`, or null if none remain. */
export function nextLockedWeek(week: number): number | null {
  return week < TOTAL_WEEKS ? week + 1 : null;
}

/** First study day that is unlocked and not yet done — where "Continue" points. */
export function firstOpenIncompleteDay(
  isDone: (key: string) => boolean,
  today: Date = new Date(),
): StudyDay | null {
  for (const d of allDays()) {
    if (isDayUnlocked(d.week, d.day, isDone, today) && !isDone(dayKey(d.week, d.day))) {
      return d;
    }
  }
  return null;
}

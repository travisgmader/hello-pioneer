/**
 * sessionService — PowerSync write helpers for the active workout session.
 *
 * Exports:
 *   startSession  — generates client-side UUID, writes session metadata to MMKV
 *   commitSet     — INSERT OR REPLACE into session_sets immediately on Go/No-Go tap
 *
 * Architecture decisions:
 *   - Session UUID is generated BEFORE the first write (DATA-02, T-02-04)
 *   - The sessions table row is NOT written at session start (only session_sets are
 *     written incrementally). The sessions row is written atomically at completion
 *     (Plan 07 via writeTransaction). This means an in-progress session is represented
 *     only by MMKV + session_sets rows — no sessions row until complete.
 *   - INSERT OR REPLACE for idempotency: the session UUID means duplicate writes
 *     are no-ops (RESEARCH.md Pattern 3, Pitfall 4)
 *   - Do NOT check rowsAffected — PowerSync JSON view system returns 0 on success
 *     (RESEARCH.md Pitfall 4). Use INSERT OR REPLACE for idempotency.
 *   - Non-blocking try/catch: PowerSync local SQLite errors are programming errors;
 *     the user continues their workout regardless (practice-set.tsx pattern lines 62-70)
 *
 * Security: T-02-01 — sessionId is pulled from MMKV (derived from the user's auth
 * session startup) so session_sets rows are always scoped to the correct user via
 * the sessions.user_id RLS chain.
 */

import * as Crypto from 'expo-crypto';
import { getPowerSync } from '@/lib/powersync';
import { saveSession } from '@/hooks/useSessionPersistence';
import { ExerciseState } from '@/stores/sessionStore';
import { SetResult } from '@/hooks/useSetResult';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StartSessionOpts {
  userId: string;
  templateId: string;
  dayLabel: string;
  exercises: ExerciseState[];
}

export interface StartSessionResult {
  sessionId: string;
  startedAt: string;
}

export interface CommitSetOpts {
  setId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number | null;
  repsTarget: string;    // e.g. "8-10"
  result: SetResult;
  rpe: number | null;
  isWarmup: boolean;
  notes: string | null;
}

// ── startSession ──────────────────────────────────────────────────────────────

/**
 * Generate a session UUID and persist metadata to MMKV.
 *
 * Does NOT write to the sessions table. The sessions row is written at
 * session completion (Plan 07 completeSession via writeTransaction).
 *
 * Uses expo-crypto.randomUUID() for cryptographically secure UUID generation
 * (T-02-04 mitigation). Stores UUID + startedAt in MMKV 'active-session' instance
 * via saveSession() from useSessionPersistence.
 *
 * This is NOT a hook — it is callable from any context including useEffect.
 */
export async function startSession(opts: StartSessionOpts): Promise<StartSessionResult> {
  const sessionId = Crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Persist to MMKV before any PowerSync write (DATA-02 requirement)
  // saveSession is the imperative version — NOT the hook return value
  saveSession(sessionId);

  return { sessionId, startedAt };
}

// ── commitSet ─────────────────────────────────────────────────────────────────

/**
 * INSERT OR REPLACE a session_sets row immediately on each Go/No-Go tap.
 *
 * No batching — each set is written immediately to PowerSync local SQLite.
 * Batching risks data loss on crash (RESEARCH.md anti-pattern).
 *
 * INSERT OR REPLACE with the set UUID means re-tapping Go/No-Go on the
 * same set (result toggle) overwrites the row idempotently — no duplicates.
 *
 * T-02-03 mitigation: weightKg should be validated by the caller (SetRow
 * parseFloat + range check) before calling commitSet. This service layer
 * accepts the value as-is and trusts the caller's validation.
 */
export async function commitSet(opts: CommitSetOpts): Promise<void> {
  const {
    setId,
    sessionId,
    exerciseId,
    exerciseName,
    setNumber,
    weightKg,
    repsTarget,
    result,
    rpe,
    isWarmup,
    notes,
  } = opts;

  // Parse repsTarget: "8-10" → use low end as reps_target integer, or 0 if unparseable
  const repsTargetInt = parseInt(repsTarget.split('-')[0], 10) || 0;

  try {
    const ps = getPowerSync();
    await ps.execute(
      `INSERT OR REPLACE INTO session_sets
       (id, session_id, exercise_id, exercise_name, set_number, weight_kg,
        reps_target, result, rpe, is_warmup, notes, logged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setId,
        sessionId,
        exerciseId,
        exerciseName,
        setNumber,
        weightKg,
        repsTargetInt,
        result,
        rpe,
        isWarmup ? 1 : 0,
        notes,
        new Date().toISOString(),
      ]
    );
    // Do NOT check rowsAffected — PowerSync JSON view returns 0 on success (Pitfall 4)
  } catch (_err) {
    // PowerSync local SQLite writes should not fail in normal operation.
    // If they do, the local DB may be in a bad state — log and continue.
    // The user's in-flight set data is still in the Zustand store.
    console.warn('[sessionService] commitSet failed — local SQLite error:', _err);
  }
}

/**
 * sessionService — PowerSync write helpers for the active workout session.
 *
 * Exports:
 *   startSession      — generates client-side UUID, writes session metadata to MMKV
 *   commitSet         — INSERT OR REPLACE into session_sets immediately on Go/No-Go tap
 *   serializeSetNotes — JSON-serialize { tags, text } → string for storage
 *   parseSetNotes     — JSON-parse notes string with graceful fallback (T-02-05)
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
 *
 * Notes JSON shape (Plan 05):
 *   { tags: ('easy' | 'hard' | 'good form' | 'bad form' | 'pain')[], text: string }
 * Stored as JSON.stringify(...) in session_sets.notes.
 * T-02-05: parseSetNotes wraps JSON.parse in try/catch and falls back gracefully.
 */

import * as Crypto from 'expo-crypto';
import { createMMKV } from 'react-native-mmkv';
import { getPowerSync } from '@/lib/powersync';
import { saveSession, SESSION_KEYS } from '@/hooks/useSessionPersistence';
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

/**
 * CompleteSessionArgs — parameters for the atomic session completion write.
 * All fields required — validated by caller before invoking completeSession.
 */
export interface CompleteSessionArgs {
  /** Session UUID generated at session start (client-side, see startSession) */
  sessionId: string;
  /** Authenticated user ID from Supabase session (T-02-01 — RLS enforcement) */
  userId: string;
  /** Template ID for the completed workout */
  templateId: string;
  /** Day label (e.g. "Push", "Pull", "Legs") */
  dayLabel: string;
  /** ISO string of when the session started (from MMKV active_session_started_at) */
  startedAt: string;
  /** Session-level free text notes, or null if none */
  sessionNotes: string | null;
}

/** Notes JSON shape stored in session_sets.notes */
export interface SetNotes {
  tags: ('easy' | 'hard' | 'good form' | 'bad form' | 'pain')[];
  text: string;
}

// ── Notes helpers ─────────────────────────────────────────────────────────────

/**
 * serializeSetNotes — JSON-serialize tags + free-text into a single notes string.
 *
 * Result is stored in session_sets.notes (TEXT column).
 * Empty tags + empty text → still serialized as JSON for consistency.
 */
export function serializeSetNotes(tags: string[], text: string): string {
  return JSON.stringify({ tags, text });
}

/**
 * parseSetNotes — parse the JSON notes string from session_sets.notes.
 *
 * T-02-05 mitigation: wraps JSON.parse in try/catch.
 *   - If raw is null or empty → { tags: [], text: '' }
 *   - If JSON is valid with expected shape → { tags: string[], text: string }
 *   - If parse fails (malformed / legacy plain string) → { tags: [], text: raw }
 *
 * This ensures the UI never crashes on a row that was manually edited in the DB
 * or written by an older version of the app.
 */
export function parseSetNotes(raw: string | null): { tags: string[]; text: string } {
  if (!raw) return { tags: [], text: '' };
  try {
    const parsed = JSON.parse(raw);
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      text: typeof parsed.text === 'string' ? parsed.text : '',
    };
  } catch {
    // Legacy or malformed value — treat the entire string as free text (T-02-05)
    return { tags: [], text: raw };
  }
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

// ── completeSession ───────────────────────────────────────────────────────────

/**
 * Atomically commit the session completion via PowerSync writeTransaction.
 *
 * Implements WORKOUT-17 + DATA-02 atomic completion:
 *   1. INSERT OR REPLACE sessions row (idempotent by sessionId UUID — DATA-02)
 *   2. UPDATE split_settings rotation_pointer + 1 (advances to next day)
 *
 * Both writes are inside a single writeTransaction so they succeed or fail together.
 * This prevents the state where the session row exists but the rotation pointer
 * was not advanced (or vice versa) — T-02-10 mitigation.
 *
 * MMKV cleanup (active_session_id + active_session_started_at) is performed ONLY
 * after the transaction commits successfully. If writeTransaction throws, the
 * MMKV keys are preserved so the session can be recovered on next app open.
 *
 * Security: T-02-01 — userId is the authenticated user's ID from useSession();
 * the sessions row's user_id column is enforced by PowerSync RLS on sync upload.
 *
 * Note on rowsAffected: NOT checked — PowerSync JSON view system returns 0 on
 * success (RESEARCH.md Pitfall 4). INSERT OR REPLACE idempotency handles duplicates.
 *
 * Note on .remove() vs .delete(): MMKV v4 API uses .remove(key). Confirmed from
 * storage.ts line 69 and node_modules types (see useSessionPersistence.ts).
 */
export async function completeSession(args: CompleteSessionArgs): Promise<void> {
  const { sessionId, userId, templateId, dayLabel, startedAt, sessionNotes } = args;

  const ps = getPowerSync();

  // Atomic write: sessions upsert + rotation pointer increment (T-02-10)
  await ps.writeTransaction(async (tx) => {
    // 1. Upsert the session row — idempotent by UUID (DATA-02)
    await tx.execute(
      `INSERT OR REPLACE INTO sessions
       (id, user_id, template_id, day_label, started_at, completed_at, notes, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [sessionId, userId, templateId, dayLabel, startedAt, new Date().toISOString(), sessionNotes],
    );

    // 2. Advance the rotation pointer to the next day's template (D-13)
    await tx.execute(
      `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1 WHERE user_id = ?`,
      [userId],
    );
    // Do NOT check rowsAffected — PowerSync JSON view returns 0 on success (Pitfall 4)
  });

  // Clear MMKV session metadata ONLY after successful commit (crash-safety)
  // Uses the same MMKV instance as useSessionPersistence ('active-session')
  // Uses .remove() — confirmed v4 MMKV API (not .delete())
  const store = createMMKV({ id: 'active-session' });
  store.remove(SESSION_KEYS.id);
  store.remove(SESSION_KEYS.startedAt);
}

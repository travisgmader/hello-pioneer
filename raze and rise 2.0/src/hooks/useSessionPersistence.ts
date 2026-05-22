/**
 * useSessionPersistence — MMKV-backed session metadata hook.
 *
 * Stores the active session UUID and start timestamp in an unencrypted MMKV
 * instance separate from the encrypted Supabase session store. These values are
 * ephemeral workout metadata — not sensitive auth tokens.
 *
 * Implements WORKOUT-18: session UUID survives app kill; re-mount reads MMKV
 * and rehydrates the in-progress session.
 *
 * Key design decisions:
 *   - createMMKV({ id: 'active-session' }) — separate from 'razeandrise.session'
 *     (the encrypted auth store) and 'rest-timer' (timer state)
 *   - .remove(key) — confirmed from src/lib/storage.ts line 69 that installed
 *     react-native-mmkv v4 uses .remove() (not .delete())
 *   - useMMKVString provides reactive reads so UI can re-render when values change
 *   - saveSession and clearSession are imperative (callable from non-hook service layer)
 *
 * Session persistence lifecycle:
 *   startSession → saveSession(uuid) → [workout in progress] → clearSession() on complete
 *   Crash recovery: UUID still in MMKV → session_sets rows in PowerSync → session intact
 */

import { createMMKV, useMMKVString } from 'react-native-mmkv';

// ── MMKV instance — module scope so the same instance is reused across calls ──
// Unencrypted is intentional: session UUID + startedAt timestamp are not sensitive.
const SESSION_MMKV = createMMKV({ id: 'active-session' });

// ── Key constants — exported for testability and cross-module use ──────────────

export const SESSION_KEYS = {
  id: 'active_session_id',
  startedAt: 'active_session_started_at',
} as const;

// ── Imperative write helpers — usable from service layer (non-hook context) ────

/**
 * Persist a session UUID and current timestamp to MMKV.
 * Call before the first PowerSync write (DATA-02 requirement: UUID before write).
 */
export function saveSession(id: string): void {
  SESSION_MMKV.set(SESSION_KEYS.id, id);
  SESSION_MMKV.set(SESSION_KEYS.startedAt, new Date().toISOString());
}

/**
 * Remove session metadata from MMKV (called on session complete or abort).
 * Uses .remove() — confirmed from storage.ts line 69 that v4 MMKV uses .remove()
 * (not .delete()).
 */
export function clearSession(): void {
  SESSION_MMKV.remove(SESSION_KEYS.id);
  SESSION_MMKV.remove(SESSION_KEYS.startedAt);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseSessionPersistenceReturn {
  /** Current active session UUID, or undefined if no session in progress */
  sessionId: string | undefined;
  /** ISO string of when the session started, or undefined */
  startedAt: string | undefined;
  /** Persist a new session UUID (writes both keys to MMKV) */
  saveSession: (id: string) => void;
  /** Clear both MMKV keys (session complete or abort) */
  clearSession: () => void;
}

/**
 * useSessionPersistence — reactive MMKV hook for active session metadata.
 *
 * Returns the current sessionId and startedAt values via useMMKVString
 * (re-renders automatically when MMKV values change).
 * Also exposes saveSession() and clearSession() for convenience.
 *
 * Note: The returned saveSession/clearSession are the same module-level functions
 * re-exported for convenience — service layer can import them directly without
 * calling the hook.
 */
export function useSessionPersistence(): UseSessionPersistenceReturn {
  // useMMKVString is reactive — re-renders the consumer when the value changes
  const [sessionId] = useMMKVString(SESSION_KEYS.id, SESSION_MMKV);
  const [startedAt] = useMMKVString(SESSION_KEYS.startedAt, SESSION_MMKV);

  return {
    sessionId,
    startedAt,
    saveSession,
    clearSession,
  };
}

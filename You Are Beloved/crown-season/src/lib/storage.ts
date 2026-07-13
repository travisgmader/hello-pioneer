import { useCallback, useEffect, useState } from 'react';
import { supabase } from './auth';

/* Cloud-synced storage with a local-first cache.
 *
 * When a user is signed in, progress + journal live in Supabase (per-user rows,
 * protected by RLS) and are mirrored into localStorage so the app still reads
 * instantly and works offline. Writes update the cache immediately and push to
 * Supabase in the background. When no user is signed in (local/dev fallback),
 * everything behaves exactly like the old device-only storage.
 *
 * The hook signatures are unchanged, so the components that consume them don't
 * need to know sync exists. */

const NS = 'crown-season';
const K_PROGRESS = `${NS}:progress`; // completed day keys: string[]
const K_JOURNAL = `${NS}:journal`; // { [isoDate]: JournalEntry }
const K_OWNER = `${NS}:owner`; // auth user id the cache currently belongs to

export interface JournalEntry {
  gratitude: string;
  reflection: string;
  updatedAt: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify other hook instances in this tab.
    window.dispatchEvent(new CustomEvent(`${NS}:change`, { detail: key }));
  } catch {
    /* storage full / unavailable — fail quietly, app still works in-memory */
  }
}

/** Local calendar date (YYYY-MM-DD) — used to key the daily journal. */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ---------- Cloud sync plumbing ---------- */

// Set by SessionProvider whenever the signed-in user changes. Writes use it to
// decide whether (and as whom) to push to Supabase.
let currentUserId: string | null = null;

export function setSyncUser(id: string | null): void {
  currentUserId = id;
  if (import.meta.env.DEV) {
    (window as unknown as { __sb?: unknown; __uid?: string | null }).__sb = supabase;
    (window as unknown as { __uid?: string | null }).__uid = id;
    console.warn('[sync] user set to', id);
  }
}

const ms = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : 0);

function logCloudError(op: string, error: unknown): void {
  if (error && import.meta.env.DEV) console.warn(`[sync] ${op} failed`, error);
}

async function cloudSetProgress(dayKey: string, done: boolean): Promise<void> {
  if (!supabase || !currentUserId) {
    if (import.meta.env.DEV && !currentUserId) console.warn('[sync] progress skipped — no user');
    return;
  }
  try {
    const { error } = done
      ? await supabase.from('progress').upsert({ user_id: currentUserId, day_key: dayKey })
      : await supabase
          .from('progress')
          .delete()
          .eq('user_id', currentUserId)
          .eq('day_key', dayKey);
    logCloudError('progress', error);
  } catch (e) {
    logCloudError('progress (threw)', e);
  }
}

async function cloudSaveJournal(key: string, e: JournalEntry): Promise<void> {
  if (!supabase || !currentUserId) {
    if (import.meta.env.DEV && !currentUserId) console.warn('[sync] journal skipped — no user');
    return;
  }
  try {
    const { error } = await supabase.from('journal').upsert({
      user_id: currentUserId,
      day_key: key,
      gratitude: e.gratitude,
      reflection: e.reflection,
      updated_at: e.updatedAt,
    });
    logCloudError('journal', error);
  } catch (err) {
    logCloudError('journal (threw)', err);
  }
}

/** Pull cloud state and reconcile with the local cache for `userId`.
 * Runs once when a user signs in. Behaviour depends on who owns the cache:
 *   - no owner yet  → first login: merge local (pre-cloud) data UP into the account
 *   - same owner    → merge both directions (offline edits reconcile)
 *   - different user → the cache is someone else's: discard it, pull cloud only */
export async function syncFromCloud(userId: string): Promise<void> {
  if (!supabase) return;

  const owner = localStorage.getItem(K_OWNER);
  if (owner && owner !== userId) {
    localStorage.removeItem(K_PROGRESS);
    localStorage.removeItem(K_JOURNAL);
  }
  const useLocal = !owner || owner === userId; // trust local data only if it's ours
  localStorage.setItem(K_OWNER, userId);

  // ----- progress: union of completed day keys -----
  const localProg = useLocal ? read<string[]>(K_PROGRESS, []) : [];
  const { data: progRows } = await supabase
    .from('progress')
    .select('day_key')
    .eq('user_id', userId);
  const remoteProg = new Set((progRows ?? []).map((r) => r.day_key as string));
  const union = new Set<string>([...remoteProg, ...localProg]);

  const progToPush = [...union].filter((k) => !remoteProg.has(k));
  if (progToPush.length) {
    await supabase.from('progress').upsert(progToPush.map((k) => ({ user_id: userId, day_key: k })));
  }
  write(K_PROGRESS, [...union]);

  // ----- journal: per study-day key, newest updatedAt wins -----
  const localJ = useLocal ? read<Record<string, JournalEntry>>(K_JOURNAL, {}) : {};
  const { data: jRows } = await supabase
    .from('journal')
    .select('day_key,gratitude,reflection,updated_at')
    .eq('user_id', userId);

  const remoteJ: Record<string, JournalEntry> = {};
  for (const r of jRows ?? []) {
    remoteJ[r.day_key as string] = {
      gratitude: (r.gratitude as string) ?? '',
      reflection: (r.reflection as string) ?? '',
      updatedAt: (r.updated_at as string) ?? '',
    };
  }

  const merged: Record<string, JournalEntry> = {};
  const jToPush: Array<Record<string, unknown>> = [];
  const keys = new Set<string>([...Object.keys(remoteJ), ...Object.keys(localJ)]);
  for (const k of keys) {
    const r = remoteJ[k];
    const l = localJ[k];
    if (l && (!r || ms(l.updatedAt) > ms(r.updatedAt))) {
      merged[k] = l;
      jToPush.push({
        user_id: userId,
        day_key: k,
        gratitude: l.gratitude,
        reflection: l.reflection,
        updated_at: l.updatedAt || new Date().toISOString(),
      });
    } else if (r) {
      merged[k] = r;
    }
  }
  if (jToPush.length) await supabase.from('journal').upsert(jToPush);
  write(K_JOURNAL, merged);
}

/** Wipe the local cache (used on sign-out so nothing lingers on the device). */
export function clearLocalCache(): void {
  localStorage.removeItem(K_PROGRESS);
  localStorage.removeItem(K_JOURNAL);
  localStorage.removeItem(K_OWNER);
  window.dispatchEvent(new CustomEvent(`${NS}:change`, { detail: 'clear' }));
}

/* ---------- Progress (completed study days) ---------- */

export function useProgress() {
  const [completed, setCompleted] = useState<string[]>(() => read(K_PROGRESS, []));

  useEffect(() => {
    const sync = () => setCompleted(read(K_PROGRESS, []));
    window.addEventListener(`${NS}:change`, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(`${NS}:change`, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isDone = useCallback((key: string) => completed.includes(key), [completed]);

  const setDone = useCallback((key: string, done: boolean) => {
    const current = read<string[]>(K_PROGRESS, []);
    const next = done
      ? Array.from(new Set([...current, key]))
      : current.filter((k) => k !== key);
    write(K_PROGRESS, next);
    setCompleted(next);
    void cloudSetProgress(key, done);
  }, []);

  const toggle = useCallback(
    (key: string) => setDone(key, !read<string[]>(K_PROGRESS, []).includes(key)),
    [setDone],
  );

  return { completed, isDone, setDone, toggle };
}

/* ---------- Daily journal (gratitude + reflection) ---------- */

export function useJournal() {
  const [entries, setEntries] = useState<Record<string, JournalEntry>>(() =>
    read(K_JOURNAL, {}),
  );

  useEffect(() => {
    const sync = () => setEntries(read(K_JOURNAL, {}));
    window.addEventListener(`${NS}:change`, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(`${NS}:change`, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const get = useCallback(
    (iso: string): JournalEntry => entries[iso] ?? { gratitude: '', reflection: '', updatedAt: '' },
    [entries],
  );

  const save = useCallback((iso: string, patch: Partial<JournalEntry>) => {
    const current = read<Record<string, JournalEntry>>(K_JOURNAL, {});
    const existing = current[iso] ?? { gratitude: '', reflection: '', updatedAt: '' };
    const updated: JournalEntry = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const next = { ...current, [iso]: updated };
    write(K_JOURNAL, next);
    setEntries(next);
    void cloudSaveJournal(iso, updated);
  }, []);

  return { entries, get, save };
}

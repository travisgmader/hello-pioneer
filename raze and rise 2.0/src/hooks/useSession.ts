/**
 * useSession — subscribes to Supabase auth state changes.
 *
 * Returns { session, loading }:
 *   - loading=true initially (before the first onAuthStateChange event fires)
 *   - loading=false after the first event fires (success or error)
 *   - session=null when not signed in
 *
 * Offline-launch guard (RESEARCH.md Pitfall 3):
 *   On cold launch with no network, supabase.auth.startAutoRefresh() fires and
 *   throws a network error. If this error propagated, it would clear the session
 *   and sign the user out — they'd land on the auth screen even though they have
 *   a valid (not-yet-expired) session in MMKV. We suppress those errors so the
 *   MMKV-cached session is preserved. loading is still set to false so routing
 *   can proceed normally (user lands on Dashboard in offline mode).
 */

import { useEffect, useState } from 'react';
import type { AuthSession } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SessionState {
  session: AuthSession | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes. The first event fires almost immediately
    // with INITIAL_SESSION or SIGNED_OUT, reflecting the session stored in MMKV.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    // Kick off session restoration. Errors from network failures must be caught
    // here so they don't clear the MMKV-persisted session (offline-launch bug).
    supabase.auth.getSession().catch((err: unknown) => {
      // Suppress network errors — the session is already loaded from MMKV by
      // onAuthStateChange; this catch only fires for connectivity failures.
      // eslint-disable-next-line no-console
      console.warn('[useSession] getSession() failed (offline?):', err);
      // Ensure loading resolves even if getSession throws before onAuthStateChange fires.
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

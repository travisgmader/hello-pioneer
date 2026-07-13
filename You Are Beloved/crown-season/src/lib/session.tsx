import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, authConfigured, isLeaderEmail, type Session } from './auth';
import { setSyncUser, syncFromCloud } from './storage';
import { setLeaderMode } from './schedule';

/* App-wide auth session. Tracks the Supabase session for members and the leader
 * alike, and drives the cloud-sync layer: when the signed-in user changes, it
 * tells storage who to sync as and kicks off a one-time reconcile. */

interface SessionState {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
}

const SessionCtx = createContext<SessionState>({ session: null, user: null, loading: false });

export function useSession(): SessionState {
  return useContext(SessionCtx);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;
  useEffect(() => {
    setSyncUser(userId);
    setLeaderMode(isLeaderEmail(email));
    if (userId) void syncFromCloud(userId);
  }, [userId, email]);

  return (
    <SessionCtx.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </SessionCtx.Provider>
  );
}

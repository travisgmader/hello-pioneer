import { useState, type ReactNode } from 'react';
import { authConfigured, signInWithGoogle } from '../lib/auth';
import { useSession } from '../lib/session';
import StagLogo from './StagLogo';

/* Sign-in gate for the whole app. Members sign in with Google so their progress
 * and journal sync to their account across devices.
 *
 * Fallbacks:
 *  - No Supabase configured (e.g. a build with no creds) → run local-only.
 *  - Dev → offer a local-only bypass so the app is reachable before Google
 *    OAuth is wired up. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const [devBypass, setDevBypass] = useState(false);

  if (!authConfigured || devBypass || session) return <>{children}</>;

  if (loading) {
    return (
      <div className="leader-gate">
        <div className="leader-gate-emblem">◆</div>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="leader-gate">
      <div style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 12px rgba(242,202,80,0.35))' }}>
        <StagLogo size={72} crowned />
      </div>
      <h1 className="h1" style={{ marginBottom: 2 }}>The Crown Season</h1>
      <p className="muted" style={{ marginTop: 0, maxWidth: 340 }}>
        Sign in to save your progress and journal, and pick up right where you left off on any device.
      </p>
      <button
        className="btn btn-primary btn-lg"
        style={{ marginTop: 20 }}
        onClick={() => signInWithGoogle()}
      >
        Sign in with Google
      </button>

      {import.meta.env.DEV && (
        <button
          className="btn btn-outline"
          style={{ marginTop: 12 }}
          onClick={() => setDevBypass(true)}
        >
          Continue without signing in (dev only)
        </button>
      )}
    </div>
  );
}

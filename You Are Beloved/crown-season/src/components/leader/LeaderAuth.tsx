import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  authConfigured,
  supabase,
  signInWithGoogle,
  signOut,
  isLeaderEmail,
  LEADER_EMAIL,
  type Session,
} from '../../lib/auth';
import { LeaderDataProvider } from './LeaderData';

/* Gate for leader mode. Access = Google sign-in restricted to LEADER_EMAIL.
 * Once past the gate, the leader data is fetched (RLS-protected) — it is not in
 * the bundle. */

function LeaderShell({ onExit }: { onExit: () => void }) {
  return (
    <div className="leader-shell">
      <div className="leader-banner">
        <span className="leader-badge">◆ Leader Mode</span>
        <button className="leader-exit" onClick={onExit}>Sign out</button>
      </div>
      <nav className="leader-subnav">
        <NavLink to="/leader" end>Dashboard</NavLink>
        <NavLink to="/leader/members">Members</NavLink>
        <NavLink to="/leader/weeks">Weeks</NavLink>
      </nav>
      <LeaderDataProvider>
        <Outlet />
      </LeaderDataProvider>
    </div>
  );
}

function GateScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="leader-gate">
      <div className="leader-gate-emblem">◆</div>
      <h1 className="h1">{title}</h1>
      {children}
    </div>
  );
}

export default function LeaderAuth() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- Unconfigured (local dev): offer a dev-only bypass so the console is reachable.
  if (!authConfigured) {
    if (devBypass) return <LeaderShell onExit={() => navigate('/')} />;
    return (
      <GateScreen title="Leader Access">
        {import.meta.env.DEV ? (
          <>
            <p className="muted" style={{ marginTop: 0, maxWidth: 360 }}>
              Google sign-in isn’t configured for local dev. On the deployed leader build,
              this screen requires signing in as <strong>{LEADER_EMAIL}</strong>.
            </p>
            <button className="btn btn-primary btn-lg" style={{ marginTop: 18 }} onClick={() => setDevBypass(true)}>
              Continue (dev only)
            </button>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 0, maxWidth: 360 }}>
            Leader login isn’t configured for this deployment yet.
          </p>
        )}
      </GateScreen>
    );
  }

  if (loading) return <GateScreen title="…"><p className="muted">Checking your session…</p></GateScreen>;

  // --- Signed in ---
  if (session) {
    const email = session.user?.email;
    if (isLeaderEmail(email)) {
      return <LeaderShell onExit={async () => { await signOut(); navigate('/'); }} />;
    }
    return (
      <GateScreen title="Not Authorized">
        <p className="muted" style={{ marginTop: 0, maxWidth: 360 }}>
          You’re signed in as <strong>{email}</strong>, which isn’t the leader account for this group.
        </p>
        <button className="btn btn-outline btn-lg" style={{ marginTop: 18 }} onClick={() => signOut()}>
          Sign out
        </button>
      </GateScreen>
    );
  }

  // --- Signed out ---
  return (
    <GateScreen title="Leader Access">
      <p className="muted" style={{ marginTop: 0, maxWidth: 360 }}>
        This area holds private member information. Sign in with the leader Google account to continue.
      </p>
      <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => signInWithGoogle()}>
        Sign in with Google
      </button>
    </GateScreen>
  );
}

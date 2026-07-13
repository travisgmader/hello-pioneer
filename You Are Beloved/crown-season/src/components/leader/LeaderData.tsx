import { createContext, useContext, type ReactNode } from 'react';
import { useLeaderData, type LeaderData } from '../../lib/leader';

/* Fetches the RLS-protected leader payload once and hands it to the leader pages.
 * While it loads (or if it fails), children never render — so every page below
 * can treat the data as guaranteed-present via useLeader(). */

const LeaderCtx = createContext<LeaderData | null>(null);

export function useLeader(): LeaderData {
  const data = useContext(LeaderCtx);
  if (!data) throw new Error('useLeader must be used within <LeaderDataProvider>');
  return data;
}

export function LeaderDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useLeaderData();

  if (loading) {
    return (
      <div className="leader-gate">
        <div className="leader-gate-emblem">◆</div>
        <p className="muted">Loading leader data…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="leader-gate">
        <div className="leader-gate-emblem">◆</div>
        <h1 className="h1">Leader data unavailable</h1>
        <p className="muted" style={{ marginTop: 0, maxWidth: 360 }}>
          {error ?? 'Could not load the leader data.'}
        </p>
      </div>
    );
  }

  return <LeaderCtx.Provider value={data}>{children}</LeaderCtx.Provider>;
}

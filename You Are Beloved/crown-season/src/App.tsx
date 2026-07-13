import { lazy, Suspense } from 'react';
import { NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import StagLogo from './components/StagLogo';
import Home from './components/Home';
import Weeks from './components/Weeks';
import WeekOverview from './components/WeekOverview';
import DayView from './components/DayView';
import Journal from './components/Journal';
import About from './components/About';
import AuthGate from './components/AuthGate';

// Leader mode ships in every build as a lazy chunk. Members never download it
// (there's no link and they never navigate to /leader), and it holds NO sensitive
// data — leader content is fetched from Supabase behind RLS. Access is gated to
// the leader's email by LeaderAuth + row-level security, so one deployment safely
// serves both members and the leader.
const LeaderRoutes = lazy(() => import('./components/leader/LeaderRoutes'));

function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const canGoBack = pathname !== '/';
  return (
    <header className="topbar">
      <StagLogo size={34} className="stag" crowned />
      <div className="topbar-titles">
        <span className="topbar-title">The Crown Season</span>
        <span className="topbar-sub">A 10-week men’s group</span>
      </div>
      {canGoBack && (
        <button className="topbar-back" onClick={() => navigate(-1)} aria-label="Go back">
          ← Back
        </button>
      )}
    </header>
  );
}

function Icon({ name }: { name: 'today' | 'weeks' | 'journal' | 'about' }) {
  const common = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'today':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 18.2 8 12.7 4 8.8 9.5 8z" /></svg>
      );
    case 'weeks':
      return (
        <svg {...common} viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
      );
    case 'journal':
      return (
        <svg {...common} viewBox="0 0 24 24"><path d="M6 4h9a3 3 0 013 3v13H8a2 2 0 01-2-2z" /><path d="M9 8h7M9 12h7" /></svg>
      );
    case 'about':
      return (
        <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
      );
  }
}

function TabBar() {
  return (
    <nav className="tabbar">
      <NavLink to="/" end><span className="dot"><Icon name="today" /></span>Today</NavLink>
      <NavLink to="/weeks"><span className="dot"><Icon name="weeks" /></span>Weeks</NavLink>
      <NavLink to="/journal"><span className="dot"><Icon name="journal" /></span>Journal</NavLink>
      <NavLink to="/about"><span className="dot"><Icon name="about" /></span>About</NavLink>
    </nav>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const inLeader = pathname.startsWith('/leader');
  return (
    <AuthGate>
    <div className="app">
      <TopBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/weeks" element={<Weeks />} />
          <Route path="/week/:n" element={<WeekOverview />} />
          <Route path="/week/:n/day/:d" element={<DayView />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/leader/*"
            element={
              <Suspense fallback={<p className="muted">Opening leader mode…</p>}>
                <LeaderRoutes />
              </Suspense>
            }
          />
        </Routes>
      </main>
      {!inLeader && <TabBar />}
    </div>
    </AuthGate>
  );
}

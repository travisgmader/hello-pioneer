import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { isConfigured, supabase } from './lib/supabase';
import { ALLOWED_EMAILS } from './lib/allowedEmails';
import Nav from './components/Nav';
import Dashboard from './pages/Dashboard';
import Chores from './pages/Chores';
import FamilyCalendar from './pages/FamilyCalendar';
import MemberPage from './pages/MemberPage';
import Meals from './pages/Meals';
import Groceries from './pages/Groceries';
import Notes from './pages/Notes';
import Login from './pages/Login';
import './index.css';

const MEMBER_IDS = ['mom', 'dad', 'stella', 'roman', 'layla'];

function AppInner() {
  const { loading, authLoading, user } = useApp();
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('family-theme') || 'lavender');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('family-theme', theme);
  }, [theme]);

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <img src="/fox-logo.png" alt="Family Plan" style={{ width: 72, height: 72, objectFit: 'contain' }} />
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Family Plan…</div>
    </div>
  );

  if (isConfigured && !user) return <Login />;

  if (isConfigured && user && ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>
        <img src="/fox-logo.png" alt="Family Plan" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Access Denied</div>
        <div style={{ fontSize: 14, maxWidth: 320 }}>
          <strong>{user.email}</strong> is not authorized to access Family Plan.
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 20, background: 'var(--lavender)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <img src="/fox-logo.png" alt="Family Plan" style={{ width: 72, height: 72, objectFit: 'contain' }} />
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Family Plan…</div>
    </div>
  );

  let content;
  if (page === 'dashboard') content = <Dashboard setPage={setPage} />;
  else if (page === 'chores') content = <Chores />;
  else if (page === 'calendar') content = <FamilyCalendar />;
  else if (page === 'meals') content = <Meals />;
  else if (page === 'groceries') content = <Groceries />;
  else if (page === 'notes') content = <Notes />;
  else if (MEMBER_IDS.includes(page)) content = <MemberPage memberId={page} />;
  else content = <Dashboard setPage={setPage} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav page={page} setPage={setPage} theme={theme} setTheme={setTheme} />
      <main style={{ flex: 1 }}>{content}</main>
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        color: 'var(--text-muted)',
        fontSize: '12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--card-bg)',
      }}>
        Family Plan — Made with big muscles
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

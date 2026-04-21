import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { isConfigured } from './lib/supabase';
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

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48 }}>🐣</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Family Hub…</div>
    </div>
  );

  if (isConfigured && !user) return <Login />;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48 }}>🐣</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Family Hub…</div>
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
      <Nav page={page} setPage={setPage} />
      <main style={{ flex: 1 }}>{content}</main>
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        color: 'var(--text-muted)',
        fontSize: '12px',
        borderTop: '1px solid var(--border)',
        background: 'white',
      }}>
        🌷 Family Hub — Made with love
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

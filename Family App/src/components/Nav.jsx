import { useState } from 'react';
import { MEMBERS } from '../data/initialData';
import { useApp } from '../context/AppContext';
import { isConfigured } from '../lib/supabase';
import ThemePanel from './ThemePanel';
import styles from './Nav.module.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'chores',    label: '✅ Chores' },
  { id: 'calendar',  label: '📅 Calendar' },
  { id: 'meals',     label: '🍽️ Meals' },
  { id: 'groceries', label: '🛒 Groceries' },
  { id: 'notes',     label: '📝 Notes' },
];

const BOTTOM_BAR_ITEMS = [
  { id: 'dashboard', emoji: '🏠' },
  { id: 'chores',    emoji: '✅' },
  { id: 'calendar',  emoji: '📅' },
  { id: 'meals',     emoji: '🍽️' },
  { id: 'groceries', emoji: '🛒' },
];

export default function Nav({ page, setPage, theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useApp();

  const navigate = (id) => { setPage(id); setOpen(false); };

  const currentLabel = [...NAV_ITEMS, ...MEMBERS.map(m => ({ id: m.id, label: `${m.emoji} ${m.name}` }))]
    .find(i => i.id === page)?.label ?? '🏠 Dashboard';

  return (
    <>
    <nav className={styles.nav}>
      <button className={styles.logo} onClick={() => navigate('dashboard')}><img src="/fox-logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} />Family Plan</button>

      {/* Desktop links */}
      <div className={styles.links}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`${styles.link} ${page === item.id ? styles.active : ''}`} onClick={() => navigate(item.id)}>
            {item.label}
          </button>
        ))}
        <div className={styles.divider} />
        {MEMBERS.map(m => (
          <button
            key={m.id}
            className={`${styles.link} ${styles.member} ${page === m.id ? styles.active : ''} ${styles[m.color]}`}
            onClick={() => navigate(m.id)}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Mobile: current page label + gear + hamburger */}
      <div className={styles.mobileRight}>
        <span className={styles.mobilePageLabel}>{currentLabel}</span>
        <ThemePanel theme={theme} setTheme={setTheme} />
        <button className={styles.hamburger} onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className={`${styles.bar} ${open ? styles.barTop : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barMid : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barBot : ''}`} />
        </button>
      </div>

      <div className={styles.themeWrap}><ThemePanel theme={theme} setTheme={setTheme} /></div>

      {/* Desktop sign out */}
      {isConfigured && user && (
        <button className={styles.signOut} onClick={signOut} title={user.email}>
          Sign out
        </button>
      )}

      {/* Mobile dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropSection}>
            {NAV_ITEMS.map(item => (
              <button key={item.id} className={`${styles.dropLink} ${page === item.id ? styles.dropActive : ''}`} onClick={() => navigate(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.dropDivider} />
          <div className={styles.dropSection}>
            {MEMBERS.map(m => (
              <button
                key={m.id}
                className={`${styles.dropLink} ${styles.dropMember} ${page === m.id ? styles.dropMemberActive : ''} ${styles[m.color]}`}
                onClick={() => navigate(m.id)}
              >
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
          {isConfigured && user && (
            <div className={styles.dropSection}>
              <button className={styles.dropSignOut} onClick={signOut}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </nav>

    {/* Mobile bottom tab bar — outside <nav> to avoid stacking context issues */}
    <div className={styles.bottomBar}>
      {BOTTOM_BAR_ITEMS.map(item => (
        <button
          key={item.id}
          className={`${styles.bottomTab} ${page === item.id ? styles.bottomTabActive : ''}`}
          onClick={() => navigate(item.id)}
        >
          {item.emoji}
        </button>
      ))}
    </div>
    </>
  );
}

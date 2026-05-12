import styles from './Nav.module.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'workouts',  label: 'Workouts'  },
  { id: 'settings',  label: 'Split'     },
  { id: 'progress',  label: 'Progress'  },
]

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function Nav({ page, setPage, user, isAdmin, onSignOut }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        Raze &amp; Rise
        {isAdmin && <span className={styles.adminBadge}>admin</span>}
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${page === t.id ? styles.tabActive : ''}`}
            onClick={() => setPage(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.rightArea}>
        <button
          className={`${styles.gearBtn} ${page === 'gear' ? styles.gearActive : ''}`}
          onClick={() => setPage('gear')}
          aria-label="Settings"
          title="Settings"
        >
          <GearIcon />
        </button>

        {user && (
          <>
            <span className={styles.userEmail}>{user.email}</span>
            <button className={styles.signOut} onClick={onSignOut}>Sign out</button>
          </>
        )}
      </div>
    </nav>
  )
}

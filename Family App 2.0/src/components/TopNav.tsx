/**
 * TopNav — sticky top navigation bar (ARCH-02).
 *
 * Desktop: sticky top header with family name, six NavLink pills (center),
 * ThemeToggle + Sign-out button (right).
 *
 * Member avatar chips are NOT rendered here — D-14 defers member UI to Phase 2.
 */
import { NavLink } from 'react-router';
import { supabase } from '../data/supabase';
import { useCurrentFamily } from '../data/useCurrentFamily';
import ThemeToggle from './ThemeToggle';
import styles from './TopNav.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/chores', label: '✅ Chores' },
  { to: '/calendar', label: '📅 Calendar' },
  { to: '/meals', label: '🍽️ Meals' },
  { to: '/groceries', label: '🛒 Groceries' },
  { to: '/notes', label: '📝 Notes' },
] as const;

export default function TopNav() {
  const { data: family } = useCurrentFamily();
  const familyName = family?.name ?? 'Family Plan';

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>{familyName}</div>
      <div className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className={styles.right}>
        <ThemeToggle />
        <button
          type="button"
          className={styles.signOut}
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

/**
 * BottomNav — fixed mobile bottom-tab bar.
 *
 * Six tabs (Dashboard 🏠, Chores ✅, Calendar 📅, Meals 🍽️, Groceries 🛒,
 * Notes 📝). Each is a NavLink; the active tab gets var(--lavender-light) tint
 * and translateY(-2px) lift. Hidden on desktop (>=769px) via CSS.
 *
 * Phase 1 v2 shows all 6 tabs (v1 had 5; Notes 📝 is the addition).
 */
import { NavLink } from 'react-router';
import styles from './BottomNav.module.css';

const BOTTOM_BAR_ITEMS = [
  { to: '/dashboard', emoji: '🏠', label: 'Dashboard' },
  { to: '/chores', emoji: '✅', label: 'Chores' },
  { to: '/calendar', emoji: '📅', label: 'Calendar' },
  { to: '/meals', emoji: '🍽️', label: 'Meals' },
  { to: '/groceries', emoji: '🛒', label: 'Groceries' },
  { to: '/notes', emoji: '📝', label: 'Notes' },
] as const;

export default function BottomNav() {
  return (
    <div className={styles.bottomBar}>
      {BOTTOM_BAR_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive
              ? `${styles.bottomTab} ${styles.bottomTabActive}`
              : styles.bottomTab
          }
        >
          <span aria-label={item.label}>{item.emoji}</span>
        </NavLink>
      ))}
    </div>
  );
}

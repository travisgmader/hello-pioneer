/**
 * RootLayout — authenticated app shell (ARCH-02 + D-13).
 *
 * Mounted once for the entire protected area. Responsibilities:
 * 1. Mounts useRealtimeBridge — one Supabase Realtime channel for all
 *    family-scoped tables. Cleanup (removeChannel) fires on unmount, which
 *    happens when the user signs out (RequireAuth redirects to /login).
 * 2. Wraps children in RequireFamily — redirects to /onboarding/create-family
 *    if the authenticated user has no linked family row.
 * 3. Composes the visual shell: OfflineBanner + ReconnectedToast + TopNav +
 *    main content area (Outlet) + BottomNav.
 *
 * Layout hierarchy:
 *   <RequireFamily>            ← family guard (redirects if no family)
 *     <div.shell>
 *       <OfflineBanner />      ← fixed top (z-index 250)
 *       <ReconnectedToast />   ← fixed top-right 3-second auto-dismiss
 *       <TopNav />             ← sticky top (z-index 200)
 *       <main.main>
 *         <Outlet />           ← placeholder routes (dashboard, chores, etc.)
 *       </main>
 *       <BottomNav />          ← fixed bottom (z-index 300), mobile only
 *     </div>
 *   </RequireFamily>
 */
import { Outlet } from 'react-router';
import { useRealtimeBridge } from '../data/useRealtimeBridge';
import RequireFamily from '../auth/RequireFamily';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import OfflineBanner from '../components/OfflineBanner';
import ReconnectedToast from '../components/ReconnectedToast';
import styles from './RootLayout.module.css';

export default function RootLayout() {
  useRealtimeBridge();

  return (
    <RequireFamily>
      <div className={styles.shell}>
        <OfflineBanner />
        <ReconnectedToast />
        <TopNav />
        <main className={styles.main}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </RequireFamily>
  );
}

/**
 * ReconnectedToast — 3-second auto-dismissing toast shown when the browser
 * transitions from offline to online while mutations were paused.
 *
 * Tracks offline state via a ref so the toast only appears on a genuine
 * online→offline→online transition, not on initial page load when the
 * device was never offline.
 *
 * Dismisses automatically after 3 seconds via setTimeout cleanup.
 * The setTimeout is cleaned up in useEffect to prevent memory leaks
 * and state-updates-on-unmounted-component warnings (T-04b-05 mitigation).
 */
import { useEffect, useRef, useState } from 'react';
import styles from './ReconnectedToast.module.css';

export default function ReconnectedToast() {
  const [visible, setVisible] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
    };

    const handleOnline = () => {
      if (wasOffline.current) {
        wasOffline.current = false;
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div role="status" className={styles.toast}>
      Back online — syncing your changes
    </div>
  );
}

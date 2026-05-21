/**
 * OfflineBanner — fixed top banner shown when the device is offline or has
 * paused mutations queued in TanStack Query's MutationCache.
 *
 * Listens to two signals:
 * 1. window 'online'/'offline' events — direct browser connectivity signal.
 * 2. queryClient.getMutationCache().subscribe — catches paused mutations that
 *    accumulate when mutations.networkMode === 'offlineFirst' and the device is
 *    offline. This ensures the banner stays visible until all queued mutations
 *    have replayed (even if navigator.onLine flips back to true before TanStack
 *    Query has finished its retry burst).
 *
 * Cleanup (T-04b-05 mitigation): both the MutationCache unsubscribe function
 * and the window event listeners are removed in the useEffect cleanup. React
 * calls cleanup on unmount, preventing leaks.
 *
 * z-index 250 — above the sticky TopNav (200) but below the fixed BottomNav (300).
 */
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [hasPausedMutations, setHasPausedMutations] = useState(false);

  // Subscribe to MutationCache changes to track paused mutations
  useEffect(() => {
    const update = () =>
      setHasPausedMutations(
        queryClient.getMutationCache().getAll().some((m) => m.state.isPaused),
      );
    update();
    const unsubscribe = queryClient.getMutationCache().subscribe(update);
    return unsubscribe;
  }, [queryClient]);

  // Track window online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && !hasPausedMutations) return null;

  return (
    <div role="status" className={styles.banner}>
      {'Offline — changes will sync when reconnected'}
    </div>
  );
}

export default OfflineBanner;

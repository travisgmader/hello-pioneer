/**
 * Migration screen — full-screen progress indicator for v1 → v2 data migration.
 *
 * Shown when migration_status is 'pending' | 'in_progress' | 'failed'.
 * User cannot navigate away until migration succeeds (or they retry / contact support).
 *
 * Flow:
 *   1. On mount, if status is 'pending' or 'in_progress', call startMigration().
 *   2. useMigrationStatus polls every 2000ms while status is pending/in_progress.
 *   3. On 'complete', auto-navigate to onboarding after 1500ms.
 *   4. On 'failed', show Retry button → resets triggered flag and calls startMigration() again.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import MigrationProgress from '@/components/MigrationProgress';
import { useMigrationStatus } from '@/hooks/useMigrationStatus';
import { startMigration } from '@/services/migration';
import { useSession } from '@/hooks/useSession';

export default function MigrationScreen() {
  const { session } = useSession();
  const { migrationStatus } = useMigrationStatus(session?.user.id);
  const router = useRouter();

  // Guard against calling startMigration() multiple times on re-renders
  const triggered = useRef(false);

  // Trigger migration on mount if status indicates it should begin
  useEffect(() => {
    if (!session || triggered.current) return;
    if (migrationStatus === 'pending' || migrationStatus === 'in_progress') {
      triggered.current = true;
      startMigration();
    }
  }, [session, migrationStatus]);

  // Auto-navigate to onboarding after migration completes
  useEffect(() => {
    if (migrationStatus === 'complete') {
      const t = setTimeout(
        () => router.replace('/(onboarding)/profile'),
        1500,
      );
      return () => clearTimeout(t);
    }
  }, [migrationStatus, router]);

  function handleRetry() {
    triggered.current = false;
    if (session) {
      triggered.current = true;
      startMigration();
    }
  }

  return (
    <MigrationProgress status={migrationStatus} onRetry={handleRetry} />
  );
}

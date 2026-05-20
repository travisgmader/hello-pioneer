/**
 * useMigrationStatus — polls the migration_status column on the user's profile.
 *
 * Uses TanStack Query with a conditional refetchInterval:
 *   - Polls every 2000ms while status is 'pending' or 'in_progress'
 *   - Stops polling once status reaches 'complete', 'failed', or 'none'
 *
 * Returns { migrationStatus, loading }:
 *   - migrationStatus: MigrationStatus value (defaults to 'none' when no data)
 *   - loading: true until the first successful query
 *
 * Root layout uses this to gate the migration screen:
 *   pending | in_progress | failed → /migration (full-screen progress)
 *   none | complete → proceed to onboarding or tabs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type MigrationStatus =
  | 'none'
  | 'pending'
  | 'in_progress'
  | 'complete'
  | 'failed';

interface UseMigrationStatusResult {
  migrationStatus: MigrationStatus;
  loading: boolean;
}

const POLLING_STATUSES: MigrationStatus[] = ['pending', 'in_progress'];

export function useMigrationStatus(userId?: string): UseMigrationStatusResult {
  const { data, isPending } = useQuery({
    queryKey: ['migration-status', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('migration_status')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as { migration_status: MigrationStatus } | null;
    },
    enabled: Boolean(userId),
    refetchInterval: (query) => {
      const status = (query.state.data as { migration_status: MigrationStatus } | null)
        ?.migration_status;
      return status && POLLING_STATUSES.includes(status) ? 2000 : false;
    },
  });

  const migrationStatus: MigrationStatus =
    (data?.migration_status) ?? 'none';

  return {
    migrationStatus,
    loading: isPending && Boolean(userId),
  };
}

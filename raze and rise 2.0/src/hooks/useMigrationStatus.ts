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
import type { MigrationStatus } from '@/services/migration';

interface UseMigrationStatusResult {
  migrationStatus: MigrationStatus;
  loading: boolean;
}

const POLLING_STATUSES: MigrationStatus[] = ['pending', 'in_progress'];

export function useMigrationStatus(
  userId: string | undefined,
): UseMigrationStatusResult {
  const { data, isLoading } = useQuery<MigrationStatus | null>({
    queryKey: ['migration_status', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('migration_status')
        .eq('user_id', userId)
        .single();
      return (data?.migration_status as MigrationStatus) ?? 'none';
    },
    enabled: !!userId,
    refetchInterval: (query) => {
      const status = query.state.data;
      return status && POLLING_STATUSES.includes(status) ? 2000 : false;
    },
  });

  return {
    migrationStatus: data ?? 'none',
    loading: isLoading,
  };
}

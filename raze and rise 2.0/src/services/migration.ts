/**
 * Migration service — client-side trigger and polling for v1 → v2 data migration.
 *
 * startMigration():
 *   1. Marks profiles.migration_status = 'pending' locally
 *   2. Fires the 'migrate-v1-user' Edge Function (fire-and-forget)
 *   3. Polls profiles.migration_status every 1500ms until 'complete' or 'failed'
 *   4. Returns the final status (max 60s poll window)
 *
 * checkMigrationStatus():
 *   Single-shot fetch of the current migration_status for the given userId.
 */

import { supabase } from '@/lib/supabase';

export type MigrationStatus =
  | 'none'
  | 'pending'
  | 'in_progress'
  | 'complete'
  | 'failed';

/**
 * Returns the current migration_status for the given user from the profiles table.
 * Defaults to 'none' if the row is missing or the column is null.
 */
export async function checkMigrationStatus(
  userId: string,
): Promise<MigrationStatus> {
  const { data } = await supabase
    .from('profiles')
    .select('migration_status')
    .eq('user_id', userId)
    .single();
  return (data?.migration_status as MigrationStatus) ?? 'none';
}

/**
 * Triggers the 'migrate-v1-user' Edge Function for the authenticated user and
 * polls until the migration completes or fails. Returns the final status.
 *
 * The Edge Function reads the user JWT from the Authorization header (passed
 * automatically by supabase.functions.invoke) so no userId parameter is needed.
 */
export async function startMigration(): Promise<'complete' | 'failed'> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return 'failed';

  // Mark pending locally so the UI can show progress immediately
  await supabase
    .from('profiles')
    .update({ migration_status: 'pending' })
    .eq('user_id', session.user.id);

  // Fire-and-forget — the Edge Function writes status updates to profiles;
  // we poll below rather than awaiting the invoke result.
  supabase.functions.invoke('migrate-v1-user').catch(() => {
    // Ignore invoke errors — the failed status will surface via polling
  });

  // Poll every 1500ms for up to 60 seconds
  const start = Date.now();
  while (Date.now() - start < 60_000) {
    await new Promise<void>(r => setTimeout(r, 1500));
    const status = await checkMigrationStatus(session.user.id);
    if (status === 'complete' || status === 'failed') return status;
  }

  // Timeout — treat as failure so the user can retry
  return 'failed';
}

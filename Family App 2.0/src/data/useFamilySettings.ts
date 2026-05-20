/**
 * useFamilySettings — mutation hook for PATCHing `family_settings`.
 *
 * Implements CONTEXT.md D-15 cross-device theme persistence. The data path is:
 *
 *   ThemeToggle (01-04b)
 *     → useFamilySettings().mutate({ theme })
 *     → supabase.from('family_settings').update(...).eq('family_id', X)
 *     → realtime postgres_changes event fires on every device subscribed to
 *       this family's channel
 *     → useRealtimeBridge invalidates the relevant queryKey
 *     → useCurrentFamily refetches and returns the new theme
 *     → ThemeProvider re-reads family_settings.theme and applies it.
 *
 * This closes the cross-device sync loop without polling — every device
 * logged into the same family sees the toggle within ~200ms.
 *
 * Defensive throw on missing familyId: ThemeToggle is mounted inside
 * RootLayout, which is inside RequireFamily, which only renders when
 * `useCurrentFamily().data` is non-null. So the throw should never fire in
 * practice; it documents the invariant and surfaces the bug if a future
 * caller breaks the boundary.
 *
 * Cache invalidation: we invalidate `['current-family']` on success so
 * ThemeProvider re-reads the new value immediately on THIS device. The
 * realtime bridge separately invalidates on OTHER devices.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useCurrentFamily } from './useCurrentFamily';
import type { Database } from './types';

type FamilySettingsRow = Database['public']['Tables']['family_settings']['Row'];

export function useFamilySettings(): UseMutationResult<void, Error, Partial<FamilySettingsRow>> {
  const qc = useQueryClient();
  const { data: family } = useCurrentFamily();

  return useMutation<void, Error, Partial<FamilySettingsRow>>({
    mutationFn: async (patch) => {
      if (!family?.id) {
        throw new Error('No current family — cannot update settings');
      }
      const { error } = await supabase
        .from('family_settings')
        .update(patch)
        .eq('family_id', family.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-family'] });
    },
  });
}

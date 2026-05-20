/**
 * useCurrentFamily — single source of truth for the authenticated user's family.
 *
 * Implements CONTEXT.md D-11 (one query at app root yields `family_id` for
 * every downstream hook) and stages CONTEXT.md D-15 (the joined
 * `family_settings` row lets ThemeProvider read `theme` from a single query
 * without a second round-trip).
 *
 * Data shape — the query returns the user's `families` row with the
 * single-row `family_settings` embedded:
 *
 *   {
 *     id, name, emoji, ...,
 *     family_settings: { theme, timezone, ... } | null
 *   }
 *
 * Postgres-REST nested embeds return arrays unless the FK is unique. The
 * `family_settings_family_id_fkey` is marked `isOneToOne: true` in
 * `src/data/types.ts` (backed by the unique partial index on
 * `family_settings.family_id`), so PostgREST returns a single object — the
 * `FamilyWithSettings` type alias treats it as `FamilySettingsRow | null`.
 *
 * Cache shape:
 *   - `queryKey: ['current-family']` (stable across the whole app)
 *   - `staleTime: Infinity` — the realtime bridge invalidates this key on
 *     every server-side row change to `families` OR `family_settings`, so
 *     polling/refetch is redundant.
 *
 * Pitfalls mitigated:
 *   - Pitfall 3 (Realtime subscribed before auth): this hook returns `null`
 *     when no user is present, which gates `useRealtimeBridge`.
 *   - Pitfall 7 (`family_id` missing from optimistic INSERTs): downstream
 *     hooks read `family.id` from here, so the value is always present.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Database } from './types';

type FamiliesRow = Database['public']['Tables']['families']['Row'];
type FamilySettingsRow = Database['public']['Tables']['family_settings']['Row'];

export type FamilyWithSettings = FamiliesRow & {
  family_settings: FamilySettingsRow | null;
};

export function useCurrentFamily(): UseQueryResult<FamilyWithSettings | null, Error> {
  return useQuery<FamilyWithSettings | null, Error>({
    queryKey: ['current-family'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('members')
        .select('family_id, families:family_id ( *, family_settings ( * ) )')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      // PostgREST returns the embedded `families` object (with embedded
      // `family_settings`) when the FK is one-to-one. Cast through unknown
      // because the generated type inference for nested embeds is loose.
      return ((data?.families as unknown) as FamilyWithSettings | undefined) ?? null;
    },
    staleTime: Infinity,
  });
}

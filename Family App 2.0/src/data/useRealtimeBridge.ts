/**
 * useRealtimeBridge — single Supabase Realtime channel mounted at the
 * authenticated layout root (RootLayout, added by 01-04b).
 *
 * Implements ARCH-07: every family-scoped table fires postgres_changes
 * events into ONE channel, and each event becomes a targeted
 * `queryClient.invalidateQueries` call. TanStack Query then refetches the
 * canonical row from Supabase — we never push the payload directly into the
 * cache (CLAUDE.md anti-pattern + RESEARCH.md §Pattern 7).
 *
 * Mount requirements (RESEARCH.md Pitfall 3):
 *   - MUST be called inside RootLayout, AFTER `requireAuthLoader` has
 *     resolved and AFTER `RequireFamily` has confirmed `useCurrentFamily`
 *     returns a non-null row. Realtime authorization is set at subscribe
 *     time; subscribing before auth produces a silent dead channel that
 *     never recovers even after the JWT updates.
 *   - The hook itself bails out when `familyId` is undefined as a
 *     defence-in-depth measure.
 *
 * Cleanup:
 *   - Calls `supabase.removeChannel(channel)` — NOT the per-channel
 *     ".unsubscribe()" instance method. `removeChannel` both unsubs the
 *     WebSocket and drops the client's internal reference (CLAUDE.md
 *     §Supabase Realtime Patterns +
 *     supabase.com/docs/reference/javascript/removechannel).
 *
 * Filter strategy:
 *   - `families` filter is `id=eq.<familyId>` because `families` has no
 *     `family_id` column — its own `id` IS the family id.
 *   - Every other table filters on `family_id=eq.<familyId>`. RLS is the
 *     server-side backstop; the filter just cuts wasted WebSocket traffic.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useCurrentFamily } from './useCurrentFamily';

const FAMILY_SCOPED_TABLES = [
  'families',
  'members',
  'family_settings',
  'chores',
  'chore_completions',
  'events',
  'meals',
  'groceries',
  'notes',
  'push_subscriptions',
  'notifications_queue',
] as const;

export function useRealtimeBridge(): void {
  const queryClient = useQueryClient();
  const { data: family } = useCurrentFamily();
  const familyId = family?.id;

  useEffect(() => {
    if (!familyId) return;

    let channel = supabase.channel(`family:${familyId}`);
    for (const table of FAMILY_SCOPED_TABLES) {
      const filter =
        table === 'families' ? `id=eq.${familyId}` : `family_id=eq.${familyId}`;
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => {
          queryClient.invalidateQueries({ queryKey: [table, familyId] });
        },
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, queryClient]);
}

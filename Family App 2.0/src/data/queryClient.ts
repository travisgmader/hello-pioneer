/**
 * TanStack Query v5 root singleton (ARCH-03 + ARCH-09).
 *
 * Single QueryClient consumed by every hook in the app — wired into
 * `<QueryClientProvider client={queryClient}>` at the root of `main.tsx`.
 *
 * Config rationale (CONTEXT.md D-01 + D-02 + CLAUDE.md §TanStack Query v5):
 *
 *   - `queries.networkMode: 'online'` — queries pause when the device is
 *     offline and refetch on reconnect. Realtime bridge invalidates anyway
 *     when the family's data changes server-side, so a 30s stale window is
 *     fine even on a fresh visit (CONTEXT.md D-01).
 *
 *   - `mutations.networkMode: 'offlineFirst'` — paused mutations queue in
 *     memory and replay when the device reconnects. This is the entire
 *     basis of v2's offline story; we deliberately skip `persistQueryClient`
 *     /`dehydrate`/`hydrate` in Phase 1 per CONTEXT.md D-02 — losing the
 *     queue on a hard page close while offline is acceptable until Phase 6
 *     wires up the service worker.
 *
 *   - `staleTime: 30_000` — chosen because the realtime bridge
 *     (`useRealtimeBridge`) invalidates on every server-side row change. A
 *     30 second floor stops cascading refetches when multiple components
 *     mount at once during a tab switch.
 *
 *   - `gcTime: 5 * 60_000` — keeps unused cache around for 5 minutes so
 *     navigating back to a tab feels instant.
 *
 *   - `retry: 1` on queries / `retry: 0` on mutations — queries can hit a
 *     transient network blip; mutations need user-visible failure so the
 *     offline banner + the form can recover gracefully.
 *
 *   - `refetchOnWindowFocus: false` — the realtime bridge handles staleness,
 *     so window-focus refetch would just double-fire.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 0,
    },
  },
});

/**
 * Loader-based auth guard for protected routes.
 *
 * `requireAuthLoader` is wired to the parent `/` route in `src/routes/router.tsx`.
 * React Router v7 runs loaders BEFORE the matching route's element mounts —
 * the canonical fix for RESEARCH.md Pitfall 1 ("flash of protected content").
 *
 * Sequence:
 *   1. `supabase.auth.getSession()` — synchronously reads from localStorage.
 *      Returns null if the user has never signed in OR after sign-out.
 *   2. If no session, `throw redirect('/login')` — React Router consumes the
 *      thrown Response and navigates without rendering anything.
 *   3. If the OAuth session carries no email (provider misconfiguration), sign
 *      out and redirect to /access-denied so the user sees a recovery surface.
 *   4. Otherwise return `{ user }` so child routes can `useLoaderData()`.
 *
 * `RequireAuth` component below is exported for future nested-layout use
 * cases. Phase 1 uses the loader exclusively.
 */
import type { ReactNode } from 'react';
import { redirect, useLoaderData } from 'react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../data/supabase';

export interface RequireAuthLoaderData {
  user: User;
}

export async function requireAuthLoader(): Promise<RequireAuthLoaderData> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw redirect('/login');

  const email = session.user.email;
  if (!email) {
    // No email on the session is an OAuth provider misconfiguration.
    await supabase.auth.signOut();
    throw redirect('/access-denied');
  }

  return { user: session.user };
}

/**
 * Component wrapper that surfaces the loader data and renders children.
 * Not used in Phase 1 (the loader pattern handles everything), but kept
 * available for future nested-layout patterns that need user context.
 */
export function RequireAuth({ children }: { children: ReactNode }): ReactNode {
  // Read loader data so callers can `const { user } = useLoaderData()` upstream.
  // We don't need to do anything with it here — the read just confirms the
  // loader ran (which it must have for this component to mount).
  useLoaderData() as RequireAuthLoaderData;
  return children;
}

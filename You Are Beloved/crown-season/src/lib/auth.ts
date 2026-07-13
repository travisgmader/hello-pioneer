import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

/* Leader authentication — Google sign-in via Supabase, restricted to one email.
 *
 * Config (set at deploy time, in the LEADER build's environment):
 *   VITE_SUPABASE_URL       — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — the project's publishable/anon key
 *   VITE_LEADER_EMAIL       — the single Google account allowed in
 *
 * When the Supabase vars are absent (e.g. local dev), authConfigured is false and
 * the gate offers a dev-only bypass so the console is still reachable for building. */

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const LEADER_EMAIL = (import.meta.env.VITE_LEADER_EMAIL || 'travis.g.mader@gmail.com')
  .trim()
  .toLowerCase();

export const authConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = authConfigured
  ? createClient(url as string, anon as string, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    })
  : null;

export function isLeaderEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === LEADER_EMAIL;
}

/** Where Google should send the user back to (must be allow-listed in Supabase). */
export function redirectTarget(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTarget() },
  });
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

export type { Session };

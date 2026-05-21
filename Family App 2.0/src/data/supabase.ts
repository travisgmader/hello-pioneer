/**
 * Configured Supabase client + Google OAuth helper.
 *
 * Single source of Supabase configuration for the entire app. Every downstream
 * hook, route, and helper imports `supabase` from here.
 *
 * Config rationale (CLAUDE.md §Recommended Stack + RESEARCH.md §Pattern 3):
 *   - `flowType: 'pkce'` is the supabase-js v2 default for SPAs and is REQUIRED
 *     for OAuth without a server-side callback exchange.
 *   - `detectSessionInUrl: true` lets supabase-js automatically consume the
 *     `?code=...` query param Google returns on PKCE callback. Without this
 *     the session never lands and the user enters a redirect loop
 *     (RESEARCH.md Pitfall 1 + Pitfall 9).
 *   - `persistSession: true` + `autoRefreshToken: true` are the v2 defaults
 *     spelled out for clarity. Persisted to localStorage; tokens refresh
 *     automatically before expiry.
 *
 * The `Database` generic comes from `./types` (generated via
 * `supabase gen types typescript --linked`). It gives every `.from('chores')`
 * call full row typing without extra annotations.
 *
 * v1 -> v2 differences:
 *   - No `isConfigured` guard. `src/lib/env.ts` throws at module-load if the
 *     env vars are missing, so by the time this file runs they are present.
 *   - Helper `signInWithGoogle()` lives here, not inline in Login.tsx.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';
import type { Database } from './types';

// Re-export the `check()` helper for downstream convenience — every data
// module that imports `supabase` typically also needs `check()`.
export { check } from '../lib/check';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

/**
 * Kick off the Google OAuth PKCE flow.
 *
 * The `redirectTo` MUST end with a trailing slash (`/`). PKCE returns the
 * authorization code as a `?code=...` query param; supabase-js's
 * `detectSessionInUrl` parser only fires when the URL path matches a route the
 * app actually renders, and the bare origin + `/` is the canonical post-auth
 * landing route (RESEARCH.md Pitfall 9).
 *
 * Returns `Promise<void>`. The browser navigates away to Google before this
 * promise resolves on the success path; only the error branch returns control
 * to the caller, so `.catch(setError)` is the typical caller pattern.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
}

/**
 * Kick off the Sign in with Apple PKCE flow.
 *
 * Required by App Store Review Guidelines §4.8: if you offer any third-party
 * social sign-in (Google), you must also offer Sign in with Apple and it must
 * be at least as prominent in the UI.
 *
 * Supabase Apple OAuth must be enabled in the Supabase Dashboard →
 * Authentication → Providers → Apple, with an Apple Service ID configured
 * in the Apple Developer portal.
 */
export async function signInWithApple(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
}

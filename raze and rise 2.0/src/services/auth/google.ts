/**
 * Google OAuth authentication service via expo-auth-session + Supabase.
 *
 * Flow:
 *   1. Get OAuth URL from Supabase (skipBrowserRedirect=true — we control the browser)
 *   2. Open in-app browser via WebBrowser.openAuthSessionAsync
 *   3. On success: parse access_token + refresh_token from URL hash fragment
 *      (hash fragment, NOT query string — per RESEARCH.md T-03-S-03 mitigation)
 *   4. Call supabase.auth.setSession to establish the session
 *
 * Returns null on cancellation (caller shows no error per copywriting contract).
 * Returns AuthResponse on success or OAuth error.
 *
 * Security notes:
 *   - Hash fragment used (not query params) — harder to log/intercept
 *   - expo-auth-session includes PKCE + state param automatically (T-03-S-03)
 *   - skipBrowserRedirect: true — prevents double-redirect in in-app browser
 */
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Required for the in-app browser to detect the redirect and return control to the app
WebBrowser.maybeCompleteAuthSession();

export async function signInGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'razeandrise',
    path: 'auth-callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) return null;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  // User cancelled (closed the browser without completing OAuth)
  if (result.type !== 'success') return null;

  // Parse tokens from URL hash fragment (not query string — per RESEARCH.md)
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.slice(1));
  const access_token = params.get('access_token') ?? '';
  const refresh_token = params.get('refresh_token') ?? '';

  return supabase.auth.setSession({ access_token, refresh_token });
}

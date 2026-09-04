/**
 * Captures the URL hash fragment at module-load time.
 *
 * Supabase auth redirects (email confirmation, password recovery, and their
 * failures) come back as hash fragments — e.g.
 *   #access_token=...&type=recovery
 *   #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
 *
 * supabase-js consumes and clears that hash during client construction
 * (detectSessionInUrl defaults to true), so anything that wants to read it must
 * capture it first. This module is imported at the top of lib/supabase.js:
 * ES module imports evaluate before the importing module's body, which
 * guarantees this snapshot is taken before createClient() runs.
 */

const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''

const params = new URLSearchParams(raw)

/** Human-readable message when the auth redirect carried an error, else null. */
export const initialAuthError = params.get('error_description')
  ? params.get('error_description').replace(/\+/g, ' ')
  : params.get('error') || null

/** Error code from the redirect (e.g. 'otp_expired'), else null. */
export const initialAuthErrorCode = params.get('error_code') || null

/** Link type that produced this redirect (e.g. 'recovery', 'signup'), else null. */
export const initialAuthType = params.get('type') || null

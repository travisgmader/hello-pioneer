/**
 * Email authentication service
 *
 * All functions return the raw Supabase result — callers are responsible
 * for mapping error codes to user-facing copy (AuthScreen does this mapping).
 *
 * resetPassword: uses razeandrise:// deep link redirectTo per RESEARCH.md (AUTH-04).
 * changePassword: calls updateUser — requires an active session.
 */
import { supabase } from '@/lib/supabase';

/**
 * Sign up a new user with email and password.
 * Returns AuthResponse — check data.user and error.
 */
export async function signUpEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/**
 * Sign in an existing user with email and password.
 * Returns AuthResponse — check data.session and error.
 */
export async function signInEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Send a password reset email.
 * Uses razeandrise://reset-password as the deep link redirectTo.
 * Per T-03-I-01: response is generic — callers must NOT reveal whether
 * the email exists in the system (show generic success copy regardless).
 */
export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'razeandrise://reset-password',
  });
}

/**
 * Change the current user's password.
 * Requires an active authenticated session.
 * Returns { data, error } — show HelperText success/error in Settings.
 */
export async function changePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

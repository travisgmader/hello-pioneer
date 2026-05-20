/**
 * Email authentication service
 * Full implementation in plan 01b (lib layer)
 */

/**
 * Sends a password reset email to the provided address.
 * Uses Supabase auth.resetPasswordForEmail under the hood.
 */
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  // Placeholder — full implementation in 01b-lib-layer plan
  void email;
  return { error: null };
}

/**
 * Signs up a new user with email and password.
 */
export async function signUp(email: string, password: string): Promise<{ error: Error | null }> {
  void email;
  void password;
  return { error: null };
}

/**
 * Signs in an existing user with email and password.
 */
export async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
  void email;
  void password;
  return { error: null };
}

/**
 * Changes the password for the currently authenticated user.
 */
export async function changePassword(newPassword: string): Promise<{ error: Error | null }> {
  void newPassword;
  return { error: null };
}

/**
 * Apple Sign-In authentication service via expo-apple-authentication + Supabase.
 *
 * iOS only — Apple Sign-In button must be hidden on Android (not shown with error).
 * Platform guard throws early so callers don't need to check Platform.OS themselves.
 *
 * Flow:
 *   1. Platform guard: throw if not iOS
 *   2. Request Apple credential (FULL_NAME + EMAIL scopes)
 *   3. Validate identityToken is present (T-03-S-02 mitigation — Supabase validates JWKS)
 *   4. Call supabase.auth.signInWithIdToken with the Apple identity token
 *   5. Return the AuthResponse
 *
 * Throws:
 *   Error('Apple Sign-In iOS only') — on Android
 *   Error('Apple did not return an identity token') — if Apple credential missing token
 *   AppleAuthenticationError with code ERR_REQUEST_CANCELED — when user cancels
 *     (caller catches and treats as silent cancellation per copywriting contract)
 *
 * Security notes:
 *   - expo-apple-authentication returns a fresh credential per request (T-03-S-02)
 *   - Supabase validates the identity token's nonce via Apple JWKS
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export async function signInApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In iOS only');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  return supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
}

/**
 * Sign-out service.
 *
 * Calls supabase.auth.signOut() which automatically clears the MMKV session
 * via the supabaseStorageAdapter.removeItem() callback — no manual MMKV cleanup needed.
 *
 * The root layout's onAuthStateChange listener (useSession hook) detects the
 * SIGNED_OUT event and routes the user to the (auth) stack automatically.
 *
 * Usage: called from Settings → Sign Out Alert.alert confirmation (the ONE
 * permitted Alert in the app per CONTEXT.md Decision 3 + UI-SPEC).
 */
import { supabase } from '@/lib/supabase';

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

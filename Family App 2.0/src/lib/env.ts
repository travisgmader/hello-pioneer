/**
 * Typed environment variables.
 *
 * Reads from Vite's `import.meta.env` (populated at build time from `.env`
 * files and the host environment) and validates the required Supabase pair
 * at module-load time so downstream code can treat them as `string` (not
 * `string | undefined`).
 *
 * `vapidPublicKey` is intentionally optional in Phase 1 — Phase 6 wires up
 * Web Push and starts requiring it. Until then it stays `undefined`.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const env: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  vapidPublicKey: string | undefined;
} = {
  supabaseUrl,
  supabaseAnonKey,
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
};

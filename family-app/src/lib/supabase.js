import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = !!(url && key);

export const supabase = isConfigured ? createClient(url, key) : null;

// Dedicated realtime client that stays anonymous. This project migrated to
// asymmetric (ES256) JWT signing keys, but the Realtime service still validates
// tokens with the legacy HS256 secret — so it rejects logged-in users' ES256
// session tokens with a 401, breaking live sync. Keeping this client
// session-less makes it authenticate realtime with the anon key (HS256), which
// Realtime accepts. The v1_* tables have public-access RLS, so an anon-level
// change stream is sufficient. Use this client only for subscriptions; all
// reads/writes still go through `supabase` (the authenticated client).
export const supabaseRealtime = isConfigured
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

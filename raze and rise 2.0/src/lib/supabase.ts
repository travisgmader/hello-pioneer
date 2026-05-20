/**
 * Supabase client — singleton with MMKV session persistence.
 *
 * Auth options:
 *   storage: supabaseStorageAdapter — stores JWT in encrypted MMKV (FOUND-08)
 *   autoRefreshToken: true — refresh on expiry
 *   persistSession: true — survive app restarts
 *   detectSessionInUrl: false — mobile: OAuth callbacks arrive via deep links, not URL params
 *
 * AppState listener wires startAutoRefresh/stopAutoRefresh so token refresh
 * only runs while the app is in the foreground (avoids background battery drain
 * and suppresses network errors on offline launch — RESEARCH.md offline-launch bug).
 */

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabaseStorageAdapter } from './storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage: supabaseStorageAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Required for mobile: refresh token only while the app is foregrounded.
// When the app goes to the background, stopAutoRefresh prevents stale-token
// errors from surfacing as sign-out events on offline launch.
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

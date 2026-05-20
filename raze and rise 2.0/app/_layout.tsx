/**
 * Root layout — session gate + onboarding gate + migration gate + PowerSync init.
 *
 * Routing logic:
 *   no session                                          → (auth)
 *   session + migration_status in pending/in_progress/failed → /migration
 *   session + not onboarded                             → (onboarding)/profile
 *   session + onboarded                                 → (tabs)
 *
 * PowerSync startup sequence:
 *   1. powersync.init() called on mount (opens local SQLite file)
 *   2. powersync.connect(new AppConnector()) called when session becomes available
 *
 * OAuth deep-link handler (T-01d-S-01):
 *   Validates URL scheme is razeandrise:// before parsing tokens.
 *   Supabase validates tokens server-side before issuing a session.
 */

import '../global.css';

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useMigrationStatus } from '@/hooks/useMigrationStatus';
import { supabase } from '@/lib/supabase';
import { powersync } from '@/lib/powersync';
import { AppConnector } from '@/lib/connector';

const queryClient = new QueryClient();

// Validated migration-blocking statuses (CONTEXT.md Decision 4a).
const MIGRATION_BLOCKING_STATUSES = ['pending', 'in_progress', 'failed'] as const;

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const { session, loading: sessionLoading } = useSession();
  const { onboardingComplete } = useOnboardingState();
  const { migrationStatus, loading: migrationLoading } = useMigrationStatus(
    session?.user?.id,
  );

  // ── PowerSync init (once on mount) ──────────────────────────────────────────
  useEffect(() => {
    powersync.init().catch((err: unknown) => {
      // Non-fatal: app can still function without sync (offline mode).
      console.warn('[RootLayout] powersync.init() failed:', err);
    });
  }, []);

  // ── PowerSync connect (when session becomes available) ────────────────────
  useEffect(() => {
    if (!session) return;
    powersync.connect(new AppConnector()).catch((err: unknown) => {
      console.warn('[RootLayout] powersync.connect() failed:', err);
    });
  }, [session]);

  // ── OAuth deep-link handler (T-01d-S-01) ─────────────────────────────────
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Validate scheme before processing (security gate).
      if (!url.startsWith('razeandrise://')) return;

      // Parse access_token + refresh_token from the URL hash fragment
      // (Supabase OAuth returns tokens in the fragment, not query params).
      const parsed = Linking.parse(url);
      const params = parsed.queryParams ?? {};
      const access_token = params['access_token'];
      const refresh_token = params['refresh_token'];

      if (
        access_token &&
        refresh_token &&
        typeof access_token === 'string' &&
        typeof refresh_token === 'string'
      ) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .catch((err: unknown) => {
            console.warn('[RootLayout] setSession from deep link failed:', err);
          });
      }
    });

    return () => subscription.remove();
  }, []);

  // ── Routing gate ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionLoading || migrationLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const onMigrationScreen = segments[0] === 'migration';

    if (!session) {
      // No session → auth group.
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
      return;
    }

    // Session exists — check migration gate (CONTEXT.md Decision 4a).
    const migrationBlocking = (
      MIGRATION_BLOCKING_STATUSES as readonly string[]
    ).includes(migrationStatus);

    if (migrationBlocking) {
      if (!onMigrationScreen) {
        router.replace('/migration');
      }
      return;
    }

    // Migration clear — check onboarding gate (CONTEXT.md Decision 4b).
    if (!onboardingComplete) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/profile');
      }
      return;
    }

    // Fully authenticated and onboarded → tabs.
    if (!inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [
    session,
    sessionLoading,
    onboardingComplete,
    migrationStatus,
    migrationLoading,
    segments,
    router,
  ]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="migration" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

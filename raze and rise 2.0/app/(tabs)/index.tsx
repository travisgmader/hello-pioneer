/**
 * Dashboard tab — stub screen.
 *
 * Per UI-SPEC Dashboard Stub section:
 *   - Heading: "Welcome, {displayName ?? 'athlete'}" (24px Noto Serif 700, text-fg)
 *   - Body: "Today is a rest day." (16px Manrope 400, text-fg-muted)
 *   - Empty state card: "No workout scheduled." + caption "Real workout logging ships in Phase 2."
 *   - No action button (non-functional UI elements read as broken — UI-SPEC)
 *   - __DEV__ only: PowerSync status indicator for Walking Skeleton verification
 *
 * Full Dashboard implemented in Phase 2 (Core Session Loop).
 */

import { SafeAreaView, ScrollView, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { powersync } from '@/lib/powersync';

function useDashboardProfile() {
  return useQuery({
    queryKey: ['dashboard-profile'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return null;

      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', session.user.id)
        .single();

      return data as { display_name: string | null } | null;
    },
  });
}

export default function DashboardScreen() {
  const { data: profile } = useDashboardProfile();
  const displayName = profile?.display_name ?? 'athlete';

  // __DEV__ PowerSync status (used by 01-skeleton-verification-PLAN.md Walking Skeleton test).
  // SyncStatus uses `connected` / `connecting` booleans — derive a readable label.
  const devStatus = __DEV__
    ? powersync.currentStatus?.connected
      ? 'connected'
      : powersync.currentStatus?.connecting
        ? 'connecting'
        : 'initializing'
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          flexGrow: 1,
        }}
      >
        {/* Heading: "Welcome, {displayName}" — 24px Noto Serif 700, text-fg */}
        <Text
          style={{
            fontFamily: 'Noto Serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
        >
          {`Welcome, ${displayName}`}
        </Text>

        {/* 8px gap */}
        <View style={{ height: 8 }} />

        {/* Body: "Today is a rest day." — 16px Manrope 400, text-fg-muted */}
        <Text
          style={{
            fontFamily: 'Manrope',
            fontSize: 16,
            fontWeight: '400',
            color: '#99907C',
          }}
        >
          Today is a rest day.
        </Text>

        {/* 48px gap */}
        <View style={{ height: 48 }} />

        {/* Empty state card */}
        <View
          style={{
            backgroundColor: '#141416',
            borderRadius: 8,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '600',
              color: '#E5E2E1',
            }}
          >
            No workout scheduled.
          </Text>

          {/* 8px gap */}
          <View style={{ height: 8 }} />

          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 12,
              fontWeight: '400',
              color: '#99907C',
            }}
          >
            Real workout logging ships in Phase 2.
          </Text>
        </View>

        {/* __DEV__ PowerSync status indicator — stripped in production by Metro */}
        {__DEV__ && devStatus !== null && (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontFamily: 'Manrope',
                fontSize: 12,
                color: '#5C564B',
              }}
            >
              {`PowerSync: ${devStatus}`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

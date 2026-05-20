/**
 * Dashboard tab — Phase 1 stub screen.
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

import React from 'react';
import { SafeAreaView, ScrollView, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';

function useDashboardProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();
      return data as { display_name: string | null } | null;
    },
    enabled: !!userId,
  });
}

/**
 * __DEV__ only — reactive PowerSync status indicator.
 * Used by .maestro/powersync-init.yaml Walking Skeleton test:
 * asserts "PowerSync: ready" is visible on the Dashboard.
 * Stripped by Metro bundler in production builds.
 */
function PowerSyncStatus() {
  const [status, setStatus] = React.useState<string>('initializing');

  React.useEffect(() => {
    let cancelled = false;
    import('@/lib/powersync').then(({ getPowerSync }) => {
      const db = getPowerSync();
      const updateStatus = () => {
        if (cancelled) return;
        const s = db.currentStatus;
        setStatus(s.connected ? 'ready' : s.connecting ? 'connecting' : 'disconnected');
      };
      updateStatus();
      const unsub = db.registerListener({ statusChanged: updateStatus });
      return () => {
        cancelled = true;
        unsub();
      };
    }).catch(() => setStatus('error'));
  }, []);

  return (
    <Text
      style={{
        fontFamily: 'Manrope',
        fontSize: 11,
        color: '#99907C',
        marginTop: 4,
      }}
      allowFontScaling={false}
    >
      {`PowerSync: ${status}`}
    </Text>
  );
}

export default function DashboardScreen() {
  const { session } = useSession();
  const { data: profile } = useDashboardProfile(session?.user.id);
  const displayName = profile?.display_name ?? 'athlete';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32, flexGrow: 1 }}
      >
        {/* Heading: "Welcome, {displayName}" — 24px Noto Serif 700, text-fg (NOT accent) */}
        <Text
          className="text-fg"
          style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
          allowFontScaling={false}
        >
          {`Welcome, ${displayName}`}
        </Text>

        {/* __DEV__ PowerSync status indicator — stripped in production by Metro */}
        {__DEV__ && <PowerSyncStatus />}

        {/* 8pt gap */}
        <View className="h-sm" />

        {/* Body: "Today is a rest day." — 16px Manrope 400, text-fg-muted */}
        <Text className="text-body text-fg-muted" allowFontScaling={false}>
          Today is a rest day.
        </Text>

        {/* 48pt gap */}
        <View className="h-2xl" />

        {/* Empty state card */}
        <View className="bg-bg-elevated rounded-lg p-lg">
          <Text className="text-body font-bold text-fg" allowFontScaling={false}>
            No workout scheduled.
          </Text>
          <View className="h-sm" />
          <Text className="text-caption text-fg-muted" allowFontScaling={false}>
            Real workout logging ships in Phase 2.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

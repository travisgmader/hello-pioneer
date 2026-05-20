/**
 * Settings tab — minimal real settings screen (NOT a full placeholder).
 * Settings has auth-required functionality that must work from Phase 1.
 *
 * Sections:
 *   Account: Sign Out (Alert.alert confirmation — only permitted Alert in the app)
 *   Appearance: Dark/Light mode toggle via useTheme()
 *   Two-factor authentication: SMS MFA stub (managed via Supabase account settings)
 *
 * Sign Out: Alert.alert("Sign out?", ...) — CONTEXT.md Decision 3 exception.
 * signOut imported from src/services/auth/signOut — implemented in 01-auth-PLAN.md.
 * Stub no-op used here until that plan runs (Wave 3).
 */

// TODO: import from src/services/auth/signOut — implemented in 01-auth-PLAN.md
// import { signOut } from '@/services/auth/signOut';
const signOut = async () => {
  // No-op stub — replaced when 01-auth-PLAN.md ships src/services/auth/signOut.ts.
};

import { SafeAreaView, ScrollView, View, Text, Pressable, Alert, Switch } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      "You'll need to sign in again to see your workouts.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
        }}
      >
        {/* ── Account section ─────────────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: 'Noto Serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
        >
          Account
        </Text>

        <View style={{ height: 8 }} />

        <Pressable onPress={handleSignOut}>
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '400',
              color: '#EF4444',
            }}
          >
            Sign out
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />

        {/* ── Appearance section ───────────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: 'Noto Serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
        >
          Appearance
        </Text>

        <View style={{ height: 8 }} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '400',
              color: '#E5E2E1',
            }}
          >
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={(isDark) => setTheme(isDark ? 'dark' : 'light')}
            trackColor={{ false: '#5C564B', true: '#F2CA50' }}
            thumbColor="#E5E2E1"
          />
        </View>

        <View style={{ height: 24 }} />

        {/* ── Two-factor authentication section ───────────────────────────── */}
        <Text
          style={{
            fontFamily: 'Noto Serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
        >
          Two-factor authentication
        </Text>

        <View style={{ height: 8 }} />

        <Text
          style={{
            fontFamily: 'Manrope',
            fontSize: 16,
            fontWeight: '400',
            color: '#E5E2E1',
          }}
        >
          Set up SMS verification
        </Text>

        <View style={{ height: 8 }} />

        <Text
          style={{
            fontFamily: 'Manrope',
            fontSize: 12,
            fontWeight: '400',
            color: '#99907C',
          }}
        >
          Manage two-factor authentication in your Supabase account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

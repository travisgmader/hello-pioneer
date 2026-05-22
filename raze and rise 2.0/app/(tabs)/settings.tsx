/**
 * Settings tab — Account, Appearance, Two-factor authentication.
 *
 * Sections:
 *   Account:
 *     - Change Password (inline form: current-password + new-password + confirm)
 *     - Sign Out (native confirmation dialog — ONLY permitted system alert in the app per CONTEXT.md Decision 3)
 *   Appearance:
 *     - Dark/Light mode toggle via useTheme()
 *   Two-factor authentication:
 *     - SMS MFA stub with manual instructions (AUTH-06 — full enrollment flow is Phase 2+)
 *
 * Error/success: inline HelperText only — no toast/snackbar for form feedback.
 * Native sign-out confirmation is the ONLY system dialog in the app (UI-SPEC exception — destructive action).
 */
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, Alert, Switch } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useTheme } from '@/hooks/useTheme';
import { signOut } from '@/services/auth/signOut';
import { changePassword } from '@/services/auth/email';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { HelperText } from '@/components/HelperText';
import { Label } from '@/components/Label';

// ── Settings MMKV instance ────────────────────────────────────────────────────
// Separate from 'active-session' instance — uses 'settings' id.
const settingsStorage = new MMKV({ id: 'settings' });

/** MMKV key for the device GPS for runs preference (WORKOUT-13) */
const GPS_KEY = 'settings.useDeviceGpsForRun';

/**
 * __DEV__ only — logs a test set directly via PowerSync SQL for Walking Skeleton verification.
 * Strips from production builds via Metro's __DEV__ dead-code elimination.
 *
 * Usage: Settings → Developer Tools → "Log test set offline"
 * Step: enable airplane mode first, tap button, note UUID, re-enable network,
 *       verify row appears in Supabase session_sets table.
 */
function DevOfflineSetLogger() {
  const [status, setStatus] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  async function handleLogTestSet() {
    setLoading(true);
    setStatus('');
    try {
      const { getPowerSync } = await import('@/lib/powersync');
      const db = getPowerSync();
      // Use Date.now() as UUID fallback — exact format is not critical for dev helper.
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const setId = `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.execute(
        'INSERT INTO session_sets (id, session_id, exercise_id, set_number, weight_kg, result, logged_at) VALUES (?,?,?,?,?,?,?)',
        [setId, sessionId, 'bench-press-placeholder', 1, 100.0, 'go', new Date().toISOString()],
      );
      setStatus(`Set logged (local SQLite)\nSession UUID: ${sessionId}`);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Pressable
        onPress={handleLogTestSet}
        style={{
          backgroundColor: '#F2CA50',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text
          style={{ fontFamily: 'Manrope', fontWeight: '700', color: '#0A0A0B' }}
          allowFontScaling={false}
        >
          {loading ? 'Logging...' : 'Log test set offline'}
        </Text>
      </Pressable>
      {status ? (
        <Text
          style={{ fontFamily: 'Manrope', fontSize: 12, color: '#99907C', marginTop: 8 }}
          allowFontScaling={false}
        >
          {status}
        </Text>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();

  // ── Workout settings (WORKOUT-13) ─────────────────────────────────────────
  const [useDeviceGpsForRun, setUseDeviceGpsForRun] = useState<boolean>(
    () => settingsStorage.getBoolean(GPS_KEY) ?? false
  );

  const handleGpsToggle = (value: boolean) => {
    settingsStorage.set(GPS_KEY, value);
    setUseDeviceGpsForRun(value);
  };

  // ── Change password form ──────────────────────────────────────────────────
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  function resetPasswordForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordFormError('');
    setPasswordSuccess(false);
  }

  async function handleChangePassword() {
    setPasswordFormError('');
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordFormError('Password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFormError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError("Passwords don't match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const { error } = await changePassword(newPassword);
      if (error) {
        setPasswordFormError("Can't reach the server. Check your connection and try again.");
        return;
      }
      setPasswordSuccess(true);
      resetPasswordForm();
      setShowChangePassword(false);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        {/* ── Account section ─────────────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: 'NotoSerif-Bold',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
          allowFontScaling={false}
        >
          Account
        </Text>

        <View style={{ height: 16 }} />

        {/* Change Password */}
        <Pressable
          onPress={() => {
            setShowChangePassword((v) => !v);
            if (showChangePassword) resetPasswordForm();
          }}
        >
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '400',
              color: '#E5E2E1',
            }}
            allowFontScaling={false}
          >
            Change Password
          </Text>
        </Pressable>

        {showChangePassword ? (
          <View style={{ marginTop: 16 }}>
            {/* Current password not required by Supabase updateUser — kept for UX clarity */}
            <Label>Current password</Label>
            <View style={{ height: 4 }} />
            <TextInput
              variant="password"
              placeholder="Your current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              testID="current-password-input"
            />

            <View style={{ height: 12 }} />
            <Label>New password</Label>
            <View style={{ height: 4 }} />
            <TextInput
              variant="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              testID="new-password-input"
            />

            <View style={{ height: 12 }} />
            <Label>Confirm new password</Label>
            <View style={{ height: 4 }} />
            <TextInput
              variant="password"
              placeholder="Repeat new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              testID="confirm-new-password-input"
            />

            {passwordFormError ? (
              <>
                <View style={{ height: 8 }} />
                <HelperText variant="error">{passwordFormError}</HelperText>
              </>
            ) : null}

            <View style={{ height: 16 }} />
            <Button
              variant="primary"
              label="Update password"
              loading={passwordSubmitting}
              onPress={handleChangePassword}
            />
          </View>
        ) : null}

        {passwordSuccess ? (
          <>
            <View style={{ height: 8 }} />
            <HelperText variant="success">Password updated.</HelperText>
          </>
        ) : null}

        <View style={{ height: 16 }} />

        {/* Sign Out */}
        <Pressable onPress={handleSignOut}>
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '400',
              color: '#EF4444',
            }}
            allowFontScaling={false}
          >
            Sign out
          </Text>
        </Pressable>

        <View style={{ height: 32 }} />

        {/* ── Appearance section ───────────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: 'NotoSerif-Bold',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
          allowFontScaling={false}
        >
          Appearance
        </Text>

        <View style={{ height: 16 }} />

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
            allowFontScaling={false}
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

        <View style={{ height: 32 }} />

        {/* ── Workout section (WORKOUT-13 — GPS toggle) ────────────────────── */}
        <Text
          style={{
            fontFamily: 'NotoSerif-Bold',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
          allowFontScaling={false}
        >
          Workout
        </Text>

        <View style={{ height: 16 }} />

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
              flex: 1,
              marginRight: 12,
            }}
            allowFontScaling={false}
          >
            Use device GPS for runs
          </Text>
          <Switch
            value={useDeviceGpsForRun}
            onValueChange={handleGpsToggle}
            trackColor={{ false: '#5C564B', true: '#F2CA50' }}
            thumbColor="#E5E2E1"
            accessibilityLabel="Use device GPS for runs"
          />
        </View>

        <View style={{ height: 8 }} />

        <Text
          style={{
            fontFamily: 'Manrope',
            fontSize: 12,
            fontWeight: '400',
            color: '#99907C',
          }}
          allowFontScaling={false}
        >
          Apple Health is the default source. Device GPS fallback coming in a future update.
        </Text>

        <View style={{ height: 32 }} />

        {/* ── Two-factor authentication section ───────────────────────────── */}
        <Text
          style={{
            fontFamily: 'NotoSerif-Bold',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
          allowFontScaling={false}
        >
          Two-factor authentication
        </Text>

        <View style={{ height: 16 }} />

        <Text
          style={{
            fontFamily: 'Manrope',
            fontSize: 16,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
          allowFontScaling={false}
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
          allowFontScaling={false}
        >
          {'Manage two-factor authentication in your Supabase account settings.\n\nTo enable SMS MFA: Supabase Dashboard → Authentication → MFA → Phone → Enable. Full in-app enrollment flow coming in a future update.'}
        </Text>

        {/* ── Developer Tools section (dev builds only — stripped in production) ── */}
        {__DEV__ && (
          <>
            <View style={{ height: 24 }} />
            <Text
              style={{
                fontFamily: 'NotoSerif-Bold',
                fontSize: 24,
                fontWeight: '700',
                color: '#E5E2E1',
              }}
              allowFontScaling={false}
            >
              Developer Tools
            </Text>
            <View style={{ height: 8 }} />
            <Text
              style={{
                fontFamily: 'Manrope',
                fontSize: 12,
                fontWeight: '400',
                color: '#99907C',
              }}
              allowFontScaling={false}
            >
              Walking Skeleton verification only — not visible in production builds.
            </Text>
            <View style={{ height: 8 }} />
            <DevOfflineSetLogger />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

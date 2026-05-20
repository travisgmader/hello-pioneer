/**
 * AuthScreen — single-screen auth organism handling Sign In / Sign Up.
 *
 * Layout (per 01-UI-SPEC.md Auth Screen layout):
 *   "Raze and Rise" 32px Noto Serif 700 in accent color (shimmer TODO Phase 2, solid now)
 *   Toggle (Sign In | Sign Up)
 *   Email + Password fields (+ Confirm Password for sign-up)
 *   Forgot password link (sign-in only)
 *   Primary CTA (Continue / Create account)
 *   Form-level HelperText for API errors
 *   Divider "or"
 *   Continue with Google button
 *   Apple Sign-In button (iOS only)
 *
 * Validation: on blur for fields; on submit for API errors. NEVER on change.
 * Errors: inline HelperText ONLY — no notification overlays or native dialogs.
 *
 * Haptics:
 *   - Toggle change: Haptics.selectionAsync()
 *   - Auth error: Haptics.notificationAsync(NotificationFeedbackType.Error)
 *   - Auth success: Haptics.notificationAsync(NotificationFeedbackType.Success)
 *   - CTA tap: none
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';

import { Toggle } from '@/components/Toggle';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';
import { HelperText } from '@/components/HelperText';
import { Divider } from '@/components/Divider';

import { signInEmail, signUpEmail } from '@/services/auth/email';
import { signInGoogle } from '@/services/auth/google';
import { signInApple } from '@/services/auth/apple';

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const emailField = z
  .string()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.');

const passwordField = z.string().min(1, 'Password is required.');

const signInSchema = z.object({
  email: emailField,
  password: passwordField,
});

const signUpSchema = z
  .object({
    email: emailField,
    password: passwordField.min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type AuthMode = 'signIn' | 'signUp';

// ─── Error code mapping ───────────────────────────────────────────────────────

function mapSupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered') || lower.includes('email address is already used')) {
    return 'An account already exists for this email. Sign in instead?';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection') || lower.includes('failed to fetch')) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return "Can't reach the server. Check your connection and try again.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  // Sign In form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // Sign Up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const activeForm = mode === 'signIn' ? signInForm : signUpForm;

  // ── Mode toggle ────────────────────────────────────────────────────────────

  function handleModeChange(newMode: AuthMode) {
    setMode(newMode);
    setFormError('');
    signInForm.reset();
    signUpForm.reset();
    // Haptics fired by Toggle component internally
  }

  // ── Email + password submit ────────────────────────────────────────────────

  async function handleSubmit(data: SignInFormData | SignUpFormData) {
    setFormError('');
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        const { email, password } = data as SignInFormData;
        const { error } = await signInEmail(email, password);
        if (error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFormError(mapSupabaseError(error.message));
          return;
        }
      } else {
        const { email, password } = data as SignUpFormData;
        const { error } = await signUpEmail(email, password);
        if (error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFormError(mapSupabaseError(error.message));
          return;
        }
      }
      // Success: root layout routes automatically via session state change
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setFormError('');
    setGoogleLoading(true);
    try {
      const result = await signInGoogle();
      if (result === null) {
        // User cancelled — silent per copywriting contract
        return;
      }
      if (result.error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFormError('Sign-in with Google failed. Try again or use email.');
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Sign-in with Google failed. Try again or use email.');
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Apple Sign-In ─────────────────────────────────────────────────────────

  async function handleAppleSignIn() {
    setFormError('');
    setAppleLoading(true);
    try {
      const result = await signInApple();
      if (result.error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFormError('Sign-in with Apple failed. Try again or use email.');
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      // Apple cancellation: error code is ERR_REQUEST_CANCELED — treat as silent
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Sign-in with Apple failed. Try again or use email.');
    } finally {
      setAppleLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isSignUp = mode === 'signUp';
  const signInErrors = signInForm.formState.errors;
  const signUpErrors = signUpForm.formState.errors;
  const emailError = isSignUp ? signUpErrors.email?.message : signInErrors.email?.message;
  const passwordError = isSignUp ? signUpErrors.password?.message : signInErrors.password?.message;
  const confirmPasswordError = isSignUp ? signUpErrors.confirmPassword?.message : undefined;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Brand wordmark ─────────────────────────────────────────── */}
            {/* shimmer animation TODO Phase 2 — using solid accent now */}
            <View style={{ paddingTop: 64 }}>
              <Text
                style={{
                  fontFamily: 'NotoSerif-Bold',
                  fontSize: 32,
                  lineHeight: 38,
                  color: '#F2CA50',
                  textAlign: 'center',
                }}
                allowFontScaling={false}
              >
                Raze and Rise
              </Text>
            </View>

            {/* xl gap (32pt) */}
            <View style={{ height: 32 }} />

            {/* ── Mode toggle ───────────────────────────────────────────── */}
            <Toggle
              options={[
                { label: 'Sign In', value: 'signIn' },
                { label: 'Sign Up', value: 'signUp' },
              ]}
              value={mode}
              onChange={handleModeChange}
              haptics={true}
            />

            {/* lg gap (24pt) */}
            <View style={{ height: 24 }} />

            {/* ── Email field ───────────────────────────────────────────── */}
            <Label error={!!emailError}>Email</Label>
            <View style={{ height: 4 }} />
            {isSignUp ? (
              <Controller
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <TextInput
                    variant="email"
                    placeholder="you@example.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      signUpForm.trigger('email');
                    }}
                    error={!!signUpErrors.email}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    testID="email-input"
                  />
                )}
              />
            ) : (
              <Controller
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <TextInput
                    variant="email"
                    placeholder="you@example.com"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      signInForm.trigger('email');
                    }}
                    error={!!signInErrors.email}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    testID="email-input"
                  />
                )}
              />
            )}
            {emailError ? (
              <View style={{ height: 4 }} />
            ) : null}
            {emailError ? <HelperText variant="error">{emailError}</HelperText> : null}

            {/* md gap (16pt) */}
            <View style={{ height: 16 }} />

            {/* ── Password field ────────────────────────────────────────── */}
            <Label error={!!passwordError}>Password</Label>
            <View style={{ height: 4 }} />
            {isSignUp ? (
              <Controller
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <TextInput
                    ref={passwordRef}
                    variant="password"
                    placeholder="At least 8 characters"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      signUpForm.trigger('password');
                    }}
                    error={!!signUpErrors.password}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    testID="password-input"
                  />
                )}
              />
            ) : (
              <Controller
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <TextInput
                    ref={passwordRef}
                    variant="password"
                    placeholder="Your password"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      signInForm.trigger('password');
                    }}
                    error={!!signInErrors.password}
                    returnKeyType="go"
                    onSubmitEditing={signInForm.handleSubmit(handleSubmit)}
                    testID="password-input"
                  />
                )}
              />
            )}
            {passwordError ? (
              <View style={{ height: 4 }} />
            ) : null}
            {passwordError ? <HelperText variant="error">{passwordError}</HelperText> : null}

            {/* ── Confirm password (sign-up only) ────────────────────────── */}
            {isSignUp ? (
              <>
                <View style={{ height: 16 }} />
                <Label error={!!confirmPasswordError}>Confirm password</Label>
                <View style={{ height: 4 }} />
                <Controller
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <TextInput
                      ref={confirmPasswordRef}
                      variant="password"
                      placeholder="Your password"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={() => {
                        field.onBlur();
                        signUpForm.trigger('confirmPassword');
                      }}
                      error={!!confirmPasswordError}
                      returnKeyType="go"
                      onSubmitEditing={signUpForm.handleSubmit(handleSubmit)}
                      testID="confirm-password-input"
                    />
                  )}
                />
                {confirmPasswordError ? (
                  <View style={{ height: 4 }} />
                ) : null}
                {confirmPasswordError ? (
                  <HelperText variant="error">{confirmPasswordError}</HelperText>
                ) : null}
              </>
            ) : null}

            {/* ── Forgot password link (sign-in only) ──────────────────── */}
            {!isSignUp ? (
              <>
                <View style={{ height: 8 }} />
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  onPress={() => router.push('/(auth)/forgot-password')}
                  accessibilityRole="link"
                >
                  <Text
                    style={{
                      fontFamily: 'Manrope',
                      fontSize: 12,
                      lineHeight: 17,
                      color: '#F2CA50',
                    }}
                    allowFontScaling={false}
                  >
                    Forgot password?
                  </Text>
                </Pressable>
              </>
            ) : null}

            {/* lg gap (24pt) */}
            <View style={{ height: 24 }} />

            {/* ── Primary CTA ───────────────────────────────────────────── */}
            <Button
              variant="primary"
              label={isSignUp ? 'Create account' : 'Continue'}
              loading={isSubmitting}
              onPress={
                isSignUp
                  ? signUpForm.handleSubmit(handleSubmit)
                  : signInForm.handleSubmit(handleSubmit)
              }
            />

            {/* Form-level API error */}
            {formError ? (
              <>
                <View style={{ height: 8 }} />
                <HelperText variant="error">{formError}</HelperText>
              </>
            ) : null}

            {/* lg gap (24pt) */}
            <View style={{ height: 24 }} />

            {/* ── Divider ───────────────────────────────────────────────── */}
            <Divider variant="with-label" label="or" />

            {/* lg gap (24pt) */}
            <View style={{ height: 24 }} />

            {/* ── Google button ─────────────────────────────────────────── */}
            <Button
              variant="social-google"
              label="Continue with Google"
              loading={googleLoading}
              onPress={handleGoogleSignIn}
            />

            {/* sm gap (8pt) */}
            <View style={{ height: 8 }} />

            {/* ── Apple button (iOS only) ───────────────────────────────── */}
            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={4}
                style={{ height: 48, width: '100%' }}
                onPress={handleAppleSignIn}
              />
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AuthScreen;

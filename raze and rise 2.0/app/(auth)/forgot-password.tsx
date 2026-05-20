/**
 * Forgot Password screen — per 01-UI-SPEC.md Forgot Password Screen layout.
 *
 * States:
 *   form   — email input + Send reset link button
 *   success — CheckCircle2 icon + heading + body + Back to sign in link
 *   error   — HelperText under button
 *
 * Security: T-03-I-01 — no "account not found" error; generic success copy
 * regardless of whether the email exists (never confirm email existence).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';
import { HelperText } from '@/components/HelperText';
import { IconButton } from '@/components/IconButton';

import { resetPassword } from '@/services/auth/email';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  function validateEmail(value: string): string {
    if (!value.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
    return '';
  }

  async function handleSendResetLink() {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError('');
    setFormError('');
    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        // Per T-03-I-01: do not reveal whether account exists — show generic error only
        setFormError("Can't reach the server. Check your connection and try again.");
        return;
      }
      // Always show success regardless of whether email exists (security requirement)
      setSubmittedEmail(email.trim());
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <IconButton variant="back" onPress={() => router.back()} />
        </View>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 48,
            alignItems: 'center',
          }}
        >
          <CheckCircle2 size={32} color="#10B981" />
          <View style={{ height: 16 }} />
          <Text
            style={{
              fontFamily: 'NotoSerif-Bold',
              fontSize: 24,
              lineHeight: 30,
              color: '#E5E2E1',
              textAlign: 'center',
            }}
            allowFontScaling={false}
          >
            Check your email
          </Text>
          <View style={{ height: 8 }} />
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              lineHeight: 24,
              color: '#99907C',
              textAlign: 'center',
            }}
            allowFontScaling={false}
          >
            {`If an account exists for ${submittedEmail}, the reset link is on its way.`}
          </Text>
          <View style={{ height: 32 }} />
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            onPress={() => router.back()}
            accessibilityRole="link"
          >
            <Text
              style={{
                fontFamily: 'Manrope',
                fontSize: 16,
                lineHeight: 24,
                color: '#F2CA50',
              }}
              allowFontScaling={false}
            >
              Back to sign in
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={{ paddingTop: 16 }}>
              <IconButton variant="back" onPress={() => router.back()} />
            </View>

            <View style={{ height: 32 }} />

            {/* Heading */}
            <Text
              style={{
                fontFamily: 'NotoSerif-Bold',
                fontSize: 24,
                lineHeight: 30,
                color: '#E5E2E1',
              }}
              allowFontScaling={false}
            >
              Reset your password
            </Text>

            <View style={{ height: 8 }} />

            {/* Body */}
            <Text
              style={{
                fontFamily: 'Manrope',
                fontSize: 16,
                lineHeight: 24,
                color: '#99907C',
              }}
              allowFontScaling={false}
            >
              {"We'll email you a link to set a new one."}
            </Text>

            <View style={{ height: 32 }} />

            {/* Email field */}
            <Label error={!!emailError}>Email</Label>
            <View style={{ height: 4 }} />
            <TextInput
              variant="email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                // Only clear error on change — do not show new errors while typing
                if (emailError) setEmailError('');
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              error={!!emailError}
              returnKeyType="go"
              onSubmitEditing={handleSendResetLink}
              testID="email-input"
            />
            {emailError ? <View style={{ height: 4 }} /> : null}
            {emailError ? <HelperText variant="error">{emailError}</HelperText> : null}

            <View style={{ height: 24 }} />

            {/* Send reset link button */}
            <Button
              variant="primary"
              label="Send reset link"
              loading={isSubmitting}
              onPress={handleSendResetLink}
            />

            {formError ? <View style={{ height: 8 }} /> : null}
            {formError ? <HelperText variant="error">{formError}</HelperText> : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

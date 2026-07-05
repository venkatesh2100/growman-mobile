import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { showAlert, showWelcomeAlert } from '../../../components/Alert';
import { OtpInput } from '../../../components/OtpInput';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useSignupDraft } from '../../../lib/signupDraftContext';

export default function SignupVerifyStep() {
  const insets = useSafeAreaInsets();
  const { setToken } = useAuthStore();
  const { draft, reset } = useSignupDraft();
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!draft.email || !draft.firstName || !draft.phone || !draft.password) {
      router.replace('/(auth)/signup');
    }
  }, [draft.email, draft.firstName, draft.phone, draft.password]);

  if (!draft.email || !draft.firstName || !draft.phone || !draft.password) return null;

  const sendOtp = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await apiFetch('/checkout/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: draft.email }),
      });
      if (res.status === 409) {
        showAlert('Email already registered', 'Sign in instead.', [
          { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
          { text: 'OK', style: 'cancel' },
        ]);
        return;
      }
      if (!res.ok) {
        let msg = 'Could not send code';
        try {
          const err = await res.json();
          if (res.status === 429 && err.retry_after) {
            setCooldown(Number(err.retry_after) || 60);
            msg = 'Please wait before requesting another code.';
          } else if (err.error) msg = String(err.error);
        } catch {
          if (res.status === 429) {
            setCooldown(60);
            msg = 'Please wait before requesting another code.';
          }
        }
        setError(msg);
        return;
      }
      try {
        const ok = (await res.json()) as { cooldown?: number };
        setCooldown(Number(ok.cooldown) > 0 ? Number(ok.cooldown) : 60);
      } catch {
        setCooldown(60);
      }
      setOtpSent(true);
      // showAlert('Check your inbox', 'We sent a 6-digit code to your email.');
    } catch {
      setError('Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const completeSignup = async () => {
    setLoadingSignup(true);
    setError(null);
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: draft.firstName,
          email: draft.email,
          phone: draft.phone,
          password: draft.password,
        }),
      });
      if (!res.ok) {
        let msg = 'Could not create account';
        try {
          const err = await res.json();
          if (err.error) msg = String(err.error);
        } catch {
          /* ignore */
        }
        setError(msg);
        showAlert('Signup failed', msg);
        return;
      }
      const data = (await res.json()) as { token: string };
      const firstName = draft.firstName.trim();
      reset();
      setToken(data.token);
      router.replace('/(tabs)/home');
      setTimeout(() => showWelcomeAlert(firstName || undefined), 450);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoadingSignup(false);
    }
  };

  const verifyAndFinish = async () => {
    const code = otp.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await apiFetch('/checkout/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: draft.email, otp: code }),
      });
      if (!res.ok) {
        let msg = 'Invalid or expired code';
        try {
          const err = await res.json();
          if (err.error) msg = String(err.error);
        } catch {
          /* ignore */
        }
        setError(msg);
        return;
      }
      await completeSignup();
    } catch {
      setError('Check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const busy = sending || verifying || loadingSignup;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets>
        <View className="p-6 pt-12">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-6 self-start"
            hitSlop={12}
            disabled={busy}>
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
            <Text className="text-base text-gray-700">Back</Text>
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Step 4 of 4</Text>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text className="text-[26px] font-bold text-gray-900 mb-2">Verify your email</Text>
            <Text className="text-sm text-gray-500 mb-8">
              We&apos;ll send a one-time code to <Text className="font-medium text-gray-800">{draft.email}</Text>
            </Text>
          </Animated.View>

          {error && (
            <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )}

          {!otpSent ? (
            <TouchableOpacity
              className={`bg-green-600 p-4 rounded-2xl items-center justify-center min-h-[52px] mb-6 ${busy || cooldown > 0 ? 'opacity-60' : ''}`}
              onPress={sendOtp}
              disabled={busy || cooldown > 0}>
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send verification code'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <Text className="text-sm text-gray-600 mb-4 text-center">Enter the 6-digit code</Text>
              <OtpInput
                value={otp}
                autoFocus={otpSent}
                hasError={!!error}
                onChange={(code) => {
                  setOtp(code);
                  setError(null);
                }}
              />

              <TouchableOpacity
                className={`bg-green-600 p-4 rounded-2xl items-center justify-center min-h-[52px] mb-4 ${verifying || loadingSignup || otp.length !== 6 ? 'opacity-60' : ''}`}
                onPress={verifyAndFinish}
                disabled={verifying || loadingSignup || otp.length !== 6}>
                {verifying || loadingSignup ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Verify & create account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-2"
                onPress={sendOtp}
                disabled={sending || cooldown > 0}>
                <Text className={`text-sm ${cooldown > 0 ? 'text-gray-400' : 'text-green-600 font-medium'}`}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

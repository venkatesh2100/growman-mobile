import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { API_URL, GOOGLE_CLIENT_ID } from '../../config/env';
import { sendOtp } from '../../lib/api';
import { ensureTruecallerReady, isTruecallerConfigured, signInWithTruecaller } from '../../lib/truecaller';
import { useAuthStore } from '../../store/authStore';
import { UI } from '../../lib/ui';

const isValidIndianMobile = (v: string) => /^[6-9]\d{9}$/.test(v.trim());

export default function PhoneEntryScreen() {
  const insets = useSafeAreaInsets();
  const setToken = useAuthStore((s) => s.setToken);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [truecallerLoading, setTruecallerLoading] = useState(false);
  const [truecallerReady, setTruecallerReady] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hintAttempted = useRef(false);

  useEffect(() => {
    if (!isTruecallerConfigured()) return;
    void ensureTruecallerReady().then(setTruecallerReady);
  }, []);

  const requestPhoneHint = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    setHintLoading(true);
    try {
      const { showPhoneNumberHint } = await import('@shayrn/react-native-android-phone-number-hint');
      const picked = await showPhoneNumberHint({ showGuidanceDialog: true });
      const digits = String(picked || '')
        .replace(/^\+?91/, '')
        .replace(/\D/g, '')
        .slice(-10);
      if (digits) {
        setPhone(digits);
        setError(null);
      }
    } catch {
      // User cancelled or hints unavailable — they can type manually
    } finally {
      setHintLoading(false);
    }
  }, []);

  // Auto-open Android Phone Number Hint once on screen focus
  useEffect(() => {
    if (hintAttempted.current) return;
    hintAttempted.current = true;
    const t = setTimeout(() => {
      void requestPhoneHint();
    }, 350);
    return () => clearTimeout(t);
  }, [requestPhoneHint]);

  const finishAuth = (token: string, isNewUser?: boolean) => {
    setToken(token);
    router.replace(isNewUser ? '/(auth)/complete-profile' : '/(tabs)/home');
  };

  const handleTruecaller = async () => {
    setError(null);
    setTruecallerLoading(true);
    try {
      const result = await signInWithTruecaller();
      if (result.ok) {
        finishAuth(result.token, result.isNewUser);
        return;
      }
      if (result.reason === 'cancelled' || result.reason === 'unavailable') {
        return;
      }
      setError(result.message || 'Truecaller failed. Enter your number for SMS.');
    } finally {
      setTruecallerLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!isValidIndianMobile(phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6–9.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reqId?: string;
        token?: string;
        isNewUser?: boolean;
        verified?: boolean;
        cooldownSeconds?: number;
      };
      if (!res.ok) {
        setError(data.error || "Couldn't send the code. Try again.");
        return;
      }
      if (data.verified && data.token) {
        finishAuth(data.token, data.isNewUser);
        return;
      }
      if (!data.reqId) {
        setError("OTP service didn't return a request id. Check backend MSG91_WIDGET_ID / TOKEN_AUTH.");
        return;
      }
      router.push({
        pathname: '/(auth)/otp',
        params: { phone, reqId: data.reqId },
      });
    } catch (err) {
      console.error('[OTP] send failed', API_URL, err);
      setError(`Can't reach the server (${API_URL}). Is the Go backend running?`);
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || truecallerLoading;

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
            onPress={() => router.replace('/(auth)')}
            className="flex-row items-center gap-1 mb-6 self-start"
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
            <Text className="text-base text-gray-700">Back</Text>
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-green-600 items-center justify-center">
              <MaterialIcons name="smartphone" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text className="text-[26px] font-bold text-gray-900 mb-2 text-center">Enter mobile number</Text>
            <Text className="text-sm text-gray-500 mb-8 text-center">
              {truecallerReady
                ? 'Verify in one tap with Truecaller, or get a 6-digit SMS code.'
                : Platform.OS === 'android'
                  ? 'Pick your SIM number when prompted, or type it below. We’ll send a 6-digit code.'
                  : 'We’ll send a 6-digit code via MSG91. New numbers create an account after verify.'}
            </Text>
          </Animated.View>

          {error && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </Animated.View>
          )}

          {truecallerReady ? (
            <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mb-5">
              <TouchableOpacity
                className={`flex-row items-center justify-center bg-[#0087FF] p-4 rounded-2xl gap-2 min-h-[52px] ${busy ? 'opacity-60' : ''}`}
                onPress={handleTruecaller}
                disabled={busy}
                activeOpacity={0.9}>
                {truecallerLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-base font-semibold text-white">Opening Truecaller…</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white">Continue with Truecaller</Text>
                  </>
                )}
              </TouchableOpacity>
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-3 text-sm text-gray-500">or SMS OTP</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-3 mb-3 shadow-sm overflow-hidden">
              <View className="flex-row items-center px-2 py-4 border-r border-gray-100 mr-2">
                <Text className="text-base font-semibold text-gray-800">+91</Text>
              </View>
              <TextInput
                className="flex-1 py-4 text-base text-gray-900 tracking-widest"
                placeholder={hintLoading ? 'Detecting number…' : '10-digit mobile'}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/\D/g, '').slice(0, 10));
                  setError(null);
                }}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={10}
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />
              {hintLoading ? (
                <ActivityIndicator size="small" color={UI.color.primary} style={{ marginRight: 8 }} />
              ) : null}
            </View>

            {Platform.OS === 'android' && (
              <TouchableOpacity
                onPress={requestPhoneHint}
                disabled={hintLoading || busy}
                className="flex-row items-center self-start gap-1.5 px-3 py-2 mb-5 rounded-full border border-emerald-200 bg-emerald-50 active:opacity-80"
                hitSlop={8}>
                <MaterialIcons name="sim-card" size={16} color={UI.color.primaryDark} />
                <Text className="text-sm font-semibold" style={{ color: UI.color.primaryDark }}>
                  {phone ? 'Change number from SIM' : 'Detect my number'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-row items-center justify-center bg-green-600 p-4 rounded-2xl gap-2 min-h-[52px] ${busy ? 'opacity-60' : ''}`}
              onPress={handleSendOtp}
              disabled={busy}
              activeOpacity={0.9}>
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-base font-semibold text-white">Sending code…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="sms" size={20} color="#FFFFFF" />
                  <Text className="text-base font-semibold text-white">Send OTP</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {GOOGLE_CLIENT_ID ? (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-3 text-sm text-gray-500">Or continue with</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
              <GoogleLoginButton />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(600).duration(400)} className="mt-6 items-center">
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} hitSlop={10}>
              <Text className="text-sm text-gray-500">
                Trouble signing in? <Text className="text-green-600 font-semibold">Use email</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

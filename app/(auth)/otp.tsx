import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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
import { API_URL } from '../../config/env';
import { sendOtp, verifyOtp } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { UI } from '../../lib/ui';

const OTP_LENGTH = 6;

/** MSG91 widget retry channels */
const RESEND_CHANNELS = [
  { key: 'sms', label: 'SMS', icon: 'sms' as const, channel: 11 },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'chat' as const, channel: 12 },
  { key: 'voice', label: 'Call', icon: 'call' as const, channel: 4 },
] as const;

export default function OtpScreen() {
  const { phone, reqId: initialReqId } = useLocalSearchParams<{ phone: string; reqId: string }>();
  const setToken = useAuthStore((s) => s.setToken);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const verifying = useRef(false);
  const handleVerifyRef = useRef<(code: string) => Promise<void>>(async () => undefined);

  const [otp, setOtp] = useState('');
  const [reqId, setReqId] = useState(String(initialReqId || ''));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState<string | null>(null);
  const [smsListening, setSmsListening] = useState(false);

  const digits = phone?.replace(/\D/g, '').slice(-10) ?? '';
  const masked = digits.length === 10 ? `••••••${digits.slice(-4)}` : 'your number';

  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleVerify = useCallback(
    async (code: string) => {
      if (verifying.current || code.length !== OTP_LENGTH || !digits || !reqId) return;
      verifying.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await verifyOtp(digits, code, reqId);
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error || "That code didn't match. Check your messages and try again.");
          setOtp('');
          return;
        }
        const data = (await res.json()) as { token: string; isNewUser?: boolean };
        setToken(data.token);
        setSuccess(true);
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // optional
        }
        router.replace(data.isNewUser ? '/(auth)/complete-profile' : '/(tabs)/home');
      } catch (err) {
        console.error('[OTP] verify failed', API_URL, err);
        setError(`Can't reach the server (${API_URL}).`);
      } finally {
        setLoading(false);
        verifying.current = false;
      }
    },
    [digits, reqId, setToken]
  );

  handleVerifyRef.current = handleVerify;

  // Android: SMS User Consent — one-tap allow fills OTP and auto-submits
  useEffect(() => {
    if (Platform.OS !== 'android' || success) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const {
          requestPhoneNumber,
          addSmsListener,
          extractOtp,
          removeSmsListener,
        } = await import('@pushpendersingh/react-native-otp-verify');

        setSmsListening(true);
        subscription = addSmsListener((message) => {
          if (message.status === 'success' && message.message) {
            const code =
              extractOtp(message.message, OTP_LENGTH) ??
              message.message.match(/\d{6}/)?.[0] ??
              null;
            if (code) {
              setOtp(code);
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // ignore
              }
              void handleVerifyRef.current(code);
            }
          }
        });

        if (!cancelled) {
          await requestPhoneNumber();
        }
      } catch {
        setSmsListening(false);
      }
    })();

    return () => {
      cancelled = true;
      setSmsListening(false);
      subscription?.remove();
      import('@pushpendersingh/react-native-otp-verify')
        .then((m) => m.removeSmsListener())
        .catch(() => undefined);
    };
  }, [success, reqId]);

  const onChangeOtp = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(next);
    setError(null);
    setInfo(null);
    if (next.length === OTP_LENGTH) {
      handleVerify(next);
    }
  };

  const handleResend = async (channel: number, key: string) => {
    if (cooldown > 0 || resending || !digits || !reqId) return;
    setResending(key);
    setError(null);
    setInfo(null);
    try {
      const res = await sendOtp(digits, reqId, channel);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reqId?: string;
        channel?: number | string;
      };
      if (!res.ok) {
        setError(data.error || "Couldn't resend on that channel. Try SMS.");
        return;
      }
      if (data.reqId) setReqId(data.reqId);
      setCooldown(30);
      setOtp('');
      const via =
        key === 'whatsapp' ? 'WhatsApp' : key === 'voice' ? 'phone call' : 'SMS';
      setInfo(`Code resent via ${via}.`);
    } catch {
      setError(`Can't reach the server (${API_URL}).`);
    } finally {
      setResending(null);
    }
  };

  const cooldownActive = cooldown > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: UI.color.canvasAlt }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets>
        <View className="p-6 pt-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center mb-6 self-start active:bg-emerald-50"
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={UI.color.ink} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text className="text-[28px] mb-2" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
              Enter the code
            </Text>
            <Text className="text-sm text-gray-500 mb-1">Sent to +91 {masked}</Text>
            {Platform.OS === 'android' && smsListening ? (
              <Text className="text-xs mb-6" style={{ color: UI.color.primaryDark }}>
                Waiting for SMS — tap Allow when prompted to autofill.
              </Text>
            ) : (
              <Text className="text-sm text-gray-400 mb-6">
                {Platform.OS === 'ios'
                  ? 'Your keyboard may suggest the code from Messages.'
                  : 'Type the 6-digit code from your message.'}
              </Text>
            )}
          </Animated.View>

          {error && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </Animated.View>
          )}

          {info && !error && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <Text className="flex-1 text-sm text-emerald-700">{info}</Text>
            </Animated.View>
          )}

          {success && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <Text className="flex-1 text-sm text-emerald-600">Verified! Taking you in…</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} className="mb-6">
              <View className="flex-row justify-between gap-2">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                  const char = otp[i] ?? '';
                  const focused = otp.length === i || (otp.length === OTP_LENGTH && i === OTP_LENGTH - 1);
                  return (
                    <View
                      key={i}
                      className="flex-1 h-14 rounded-2xl bg-white border items-center justify-center shadow-sm"
                      style={{
                        borderColor: focused ? UI.color.primary : UI.color.border,
                        borderWidth: focused ? 2 : 1,
                      }}>
                      <Text className="text-xl" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
                        {char}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={onChangeOtp}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={OTP_LENGTH}
                autoFocus
                caretHidden
                style={{ position: 'absolute', opacity: 0.02, height: 56, width: '100%' }}
                accessible
                accessibilityLabel="One-time password"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center justify-center p-4 rounded-2xl gap-2 min-h-[52px] ${loading || success || otp.length < OTP_LENGTH ? 'opacity-60' : ''}`}
              style={{ backgroundColor: UI.color.primaryDark }}
              onPress={() => handleVerify(otp)}
              disabled={loading || success || otp.length < OTP_LENGTH}
              activeOpacity={0.9}>
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-base font-semibold text-white">Verifying…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="verified" size={20} color="#FFFFFF" />
                  <Text className="text-base font-semibold text-white">Verify</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="mt-6 items-center">
              {cooldownActive ? (
                <Text className="text-sm text-gray-400 mb-3">
                  Resend available in 0:{String(cooldown).padStart(2, '0')}
                </Text>
              ) : (
                <Text className="text-sm text-gray-500 mb-3">Didn&apos;t get it? Resend via</Text>
              )}
              <View className="flex-row flex-wrap justify-center gap-2">
                {RESEND_CHANNELS.map((ch) => {
                  const busy = resending === ch.key;
                  const disabled = cooldownActive || !!resending || success;
                  return (
                    <TouchableOpacity
                      key={ch.key}
                      onPress={() => handleResend(ch.channel, ch.key)}
                      disabled={disabled}
                      className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
                        disabled ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-emerald-200'
                      }`}
                      activeOpacity={0.85}>
                      {busy ? (
                        <ActivityIndicator size="small" color={UI.color.primary} />
                      ) : (
                        <MaterialIcons
                          name={ch.icon}
                          size={18}
                          color={disabled ? '#9CA3AF' : UI.color.primaryDark}
                        />
                      )}
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: disabled ? '#9CA3AF' : UI.color.primaryDark }}>
                        {ch.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { completeProfile } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const emailOk = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const setToken = useAuthStore((s) => s.setToken);
  const emailRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name so we know who to deliver to.');
      return;
    }
    if (!emailOk(email)) {
      setError("That email doesn't look quite right. Fix it or leave it blank.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await completeProfile(trimmed, email.trim() || undefined);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "We couldn't save your profile. Try again.");
        return;
      }
      const data = (await res.json()) as { token?: string };
      if (data.token) setToken(data.token);
      router.replace('/(tabs)/home');
    } catch {
      setError('Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
            Almost done
          </Text>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text className="text-[26px] font-bold text-gray-900 mb-2">Complete your profile</Text>
            <Text className="text-sm text-gray-500 mb-8">
              Just a name so we can personalize your experience. Email is optional — handy for order
              receipts.
            </Text>
          </Animated.View>

          {error && (
            <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )}

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4 shadow-sm">
              <MaterialIcons name="person" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 py-4 text-base text-gray-900"
                placeholder="Your name"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError(null);
                }}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-2 shadow-sm">
              <MaterialIcons name="email" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
              <TextInput
                ref={emailRef}
                className="flex-1 py-4 text-base text-gray-900"
                placeholder="Email (optional)"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={onContinue}
              />
            </View>
            <Text className="text-xs text-gray-400 mb-6 px-1">
              Used for order receipts — not required to shop.
            </Text>

            <TouchableOpacity
              className={`bg-green-600 p-4 rounded-2xl items-center justify-center min-h-[52px] ${loading ? 'opacity-60' : ''}`}
              onPress={onContinue}
              disabled={loading}
              activeOpacity={0.9}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Continue to Growman</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { showAlert } from '../../../components/Alert';
import { apiFetch } from '../../../lib/api';
import { useSignupDraft } from './SignupDraftContext';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function SignupEmailStep() {
  const insets = useSafeAreaInsets();
  const { draft, setDraft, reset } = useSignupDraft();
  const [email, setEmail] = useState(draft.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    const trimmed = email.trim();
    if (!emailOk(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ email: trimmed });
      const res = await apiFetch(`/auth/check-user?${params.toString()}`);
      if (!res.ok) {
        setError('Could not check email. Try again.');
        return;
      }
      const data = (await res.json()) as { exists?: boolean };
      if (data.exists) {
        showAlert(
          'You already have an account',
          'Sign in with your password or use Forgot password if needed.',
          [
            { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }
      setDraft({ email: trimmed });
      router.push('/(auth)/signup/profile');
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
          <TouchableOpacity
            onPress={() => {
              reset();
              router.replace('/(auth)');
            }}
            className="flex-row items-center gap-1 mb-6 self-start"
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
            <Text className="text-base text-gray-700">Back</Text>
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Step 1 of 4</Text>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text className="text-[26px] font-bold text-gray-900 mb-2">What&apos;s your email?</Text>
            <Text className="text-sm text-gray-500 mb-8">
              We&apos;ll check if you already have an account before we continue.
            </Text>
          </Animated.View>

          {error && (
            <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )}

          <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-6 shadow-sm">
            <MaterialIcons name="email" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 py-4 text-base text-gray-900"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={onContinue}
            />
          </View>

          <TouchableOpacity
            className={`bg-green-600 p-4 rounded-2xl items-center justify-center min-h-[52px] ${loading ? 'opacity-60' : ''}`}
            onPress={onContinue}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

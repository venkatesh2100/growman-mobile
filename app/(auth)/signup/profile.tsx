import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { useSignupDraft } from '../../../lib/signupDraftContext';

const phoneOk = (p: string) => /^[6-9][0-9]{9}$/.test(p);

export default function SignupProfileStep() {
  const insets = useSafeAreaInsets();
  const phoneRef = useRef<TextInput>(null);
  const { draft, setDraft } = useSignupDraft();
  const [firstName, setFirstName] = useState(draft.firstName);
  const [phone, setPhone] = useState(draft.phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.email) router.replace('/(auth)/signup');
  }, [draft.email]);

  if (!draft.email) return null;

  const onContinue = async () => {
    const name = firstName.trim();
    if (!name) {
      setError('Please enter your first name');
      return;
    }
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    if (!phoneOk(digits)) {
      setError('Enter a valid 10-digit mobile number (starts with 6–9)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ phone: digits });
      const res = await apiFetch(`/auth/check-user?${params.toString()}`);
      if (!res.ok) {
        setError('Could not verify phone. Try again.');
        return;
      }
      const data = (await res.json()) as { exists?: boolean };
      if (data.exists) {
        showAlert(
          'This number is already registered',
          'Sign in instead, or use a different phone number.',
          [
            { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }
      setDraft({ firstName: name, phone: digits });
      router.push('/(auth)/signup/password');
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
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-6 self-start"
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
            <Text className="text-base text-gray-700">Back</Text>
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Step 2 of 4</Text>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text className="text-[26px] font-bold text-gray-900 mb-2">A few details</Text>
            <Text className="text-sm text-gray-500 mb-2">
              Signing up as <Text className="font-medium text-gray-700">{draft.email}</Text>
            </Text>
            <Text className="text-sm text-gray-500 mb-8">We use your phone for orders and delivery updates.</Text>
          </Animated.View>

          {error && (
            <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )}

          <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4 shadow-sm">
            <MaterialIcons name="person" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 py-4 text-base text-gray-900"
              placeholder="First name"
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                setError(null);
              }}
              autoCapitalize="words"
              placeholderTextColor="#9CA3AF"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-6 shadow-sm">
            <MaterialIcons name="phone" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              ref={phoneRef}
              className="flex-1 py-4 text-base text-gray-900"
              placeholder="Mobile number"
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, '').slice(0, 10));
                setError(null);
              }}
              keyboardType="phone-pad"
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

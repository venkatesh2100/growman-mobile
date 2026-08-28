import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { UI } from '../../../lib/ui';
import { useSignupDraft } from '../../../lib/signupDraftContext';

export default function SignupPasswordStep() {
  const insets = useSafeAreaInsets();
  const { draft, setDraft } = useSignupDraft();
  const [password, setPassword] = useState(draft.password);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.email || !draft.firstName || !draft.phone) router.replace('/(auth)/signup');
  }, [draft.email, draft.firstName, draft.phone]);

  if (!draft.email || !draft.firstName || !draft.phone) return null;

  const onContinue = () => {
    if (password.length < 6) {
      setError('Use at least 6 characters for your password');
      return;
    }
    setError(null);
    setDraft({ password });
    router.push('/(auth)/signup/verify');
  };

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

          <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: UI.color.primary }}>Step 3 of 4</Text>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text className="text-[28px] mb-2" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>Create a password</Text>
            <Text className="text-sm text-gray-500 mb-8">At least 6 characters. You can change it anytime in settings.</Text>
          </Animated.View>

          {error && (
            <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2 mb-4">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )}

          <View
            className="flex-row items-center rounded-2xl px-4 mb-6"
            style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
            <MaterialIcons name="lock" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 py-4 text-base text-gray-900 pr-2"
              placeholder="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              secureTextEntry={!show}
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={onContinue}
            />
            <TouchableOpacity onPress={() => setShow((s) => !s)} hitSlop={12}>
              <MaterialIcons name={show ? 'visibility-off' : 'visibility'} size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="p-4 rounded-2xl items-center justify-center min-h-[52px]"
            style={{ backgroundColor: UI.color.primaryDark }}
            onPress={onContinue}>
            <Text className="text-base font-semibold text-white">Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

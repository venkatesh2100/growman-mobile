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
import { showAlert } from '../../components/Alert';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { GOOGLE_CLIENT_ID } from '../../config/env';
import { apiFetch } from '../../lib/api';
import { UI } from '../../lib/ui';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const { setToken } = useAuthStore();
  const insets = useSafeAreaInsets();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = "Let's get you signed in! Please enter your email and password.";
      setError(msg);
      showAlert('Almost there', msg);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "We couldn't sign you in right now. Please try again.";
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            const apiError = (errorData.error || errorData.message || '').toLowerCase();

            if (response.status === 429) {
              errorMessage = "Too many attempts. Please wait a moment and try again.";
            } else if (apiError.includes('account not found') || apiError.includes('not found') || apiError.includes('does not exist')) {
              errorMessage = "We don't have an account with that email yet. Create one to get started!";
            } else if (apiError.includes('invalid') || apiError.includes('credential') || apiError.includes('unauthorized')) {
              errorMessage = "That password doesn't look right. Check and try again, or reset it if you've forgotten.";
            } else if (apiError) {
              errorMessage = apiError;
            }
          } else if (response.status >= 500) {
            errorMessage = "Our servers are busy. Please try again in a moment.";
          } else if (response.status >= 400) {
            errorMessage = "We couldn't sign you in right now. Please try again.";
          }
        } catch {
          errorMessage = "We couldn't sign you in right now. Please try again.";
        }

        setError(errorMessage);
        showAlert('Sign in didn’t work', errorMessage);
        return;
      }

      const data = await response.json();
      setToken(data.token);
      setSuccess(true);
      showAlert('Success', 'Login successful! Welcome back!');
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const errorMsg = "Check your connection and try again. We couldn't reach our servers.";
      setError(errorMsg);
      showAlert('Connection issue', errorMsg);
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
        className="flex-1"
        style={{ backgroundColor: UI.color.canvasAlt }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>
        <View className="flex-1 justify-center p-6">
          <TouchableOpacity
            onPress={() => router.replace('/(auth)')}
            className="w-10 h-10 rounded-xl items-center justify-center mb-8 active:bg-emerald-50"
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={UI.color.ink} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text className="text-[28px] mb-2" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
              Sign in to your account
            </Text>
            <Text className="text-sm text-gray-500 mb-8">
              New here?{' '}
              <Text className="font-semibold" style={{ color: UI.color.primary }} onPress={() => router.push('/(auth)/phone')}>
                Continue with mobile
              </Text>
            </Text>
          </Animated.View>

          <View className="gap-4">
            {error && (
              <Animated.View entering={FadeInDown.duration(200)} className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 gap-2">
                <MaterialIcons name="error" size={20} color="#DC2626" />
                <Text className="flex-1 text-sm text-red-600">{error}</Text>
              </Animated.View>
            )}

            {success && (
              <Animated.View entering={FadeInDown.duration(200)} className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 gap-2">
                <MaterialIcons name="check-circle" size={20} color="#059669" />
                <Text className="flex-1 text-sm text-emerald-600">Login successful! Redirecting...</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.duration(300)}>
              <View
                className="flex-row items-center rounded-2xl px-4 mb-4"
                style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
                <MaterialIcons name="email" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  className="flex-1 py-4 text-base text-gray-900"
                  placeholder="Email or phone number"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
              <View
                className="flex-row items-center rounded-2xl px-4 mb-4"
                style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
                <MaterialIcons name="lock" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 py-4 text-base text-gray-900 pr-2"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className={`flex-row items-center justify-center p-4 rounded-2xl gap-2 min-h-[52px] ${(loading || success) ? 'opacity-60' : ''}`}
                style={{ backgroundColor: UI.color.primaryDark }}
                onPress={handleLogin}
                disabled={loading || success}>
                {loading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-base font-semibold text-white">Signing in...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white">Sign in</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {GOOGLE_CLIENT_ID && (
              <Animated.View entering={FadeInDown.delay(600).duration(400)}>
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px" style={{ backgroundColor: UI.color.border }} />
                  <Text className="mx-3 text-sm" style={{ color: UI.color.muted }}>
                    Or continue with
                  </Text>
                  <View className="flex-1 h-px" style={{ backgroundColor: UI.color.border }} />
                </View>
                <GoogleLoginButton />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(700).duration(400)}>
              <TouchableOpacity
                className="mt-2 items-center"
                onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-sm font-medium" style={{ color: UI.color.primary }}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



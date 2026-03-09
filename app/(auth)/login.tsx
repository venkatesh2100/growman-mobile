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
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const { setToken } = useAuthStore();
  const insets = useSafeAreaInsets();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      showAlert('Error', 'Please fill in all fields');
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
        let errorMessage = 'Login failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            const apiError = errorData.error || errorData.message;

            if (apiError) {
              if (apiError.includes('invalid credentials') || apiError.includes('unauthorized')) {
                errorMessage = 'Invalid email/phone or password. Please check and try again.';
              } else if (apiError.includes('not found') || apiError.includes('does not exist')) {
                errorMessage = 'No account found with this email/phone. Please sign up first.';
              } else {
                errorMessage = apiError;
              }
            }
          } else {
            const text = await response.text();
            errorMessage = text || `Server returned ${response.status}`;
          }
        } catch {
          errorMessage = `Server returned ${response.status}`;
        }

        setError(errorMessage);
        showAlert('Login Failed', errorMessage);
        return;
      }

      const data = await response.json();
      setToken(data.token);
      setSuccess(true);
      showAlert('Success', 'Login successful! Welcome back!');
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to login. Please try again.';
      setError(errorMsg);
      showAlert('Error', errorMsg);
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}>
        <View className="flex-1 justify-center p-6 mt-10">
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-green-600 items-center justify-center">
              <MaterialIcons name="login" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text className="text-[28px] font-bold text-gray-900 mb-2 text-center">Sign in to your account</Text>
            <Text className="text-sm text-gray-500 mb-8 text-center">
              Or{' '}
              <Text className="text-green-600 font-semibold" onPress={() => router.push('/(auth)/signup')}>
                create a new account
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
              <Animated.View entering={FadeInDown.duration(200)} className="flex-row items-center bg-green-50 border border-green-200 rounded-xl p-3 gap-2">
                <MaterialIcons name="check-circle" size={20} color="#16A34A" />
                <Text className="flex-1 text-sm text-green-600">Login successful! Redirecting...</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
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
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
                <MaterialIcons name="lock" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 py-4 text-base text-gray-900"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity
                className={`flex-row items-center justify-center bg-green-600 p-4 rounded-xl gap-2 min-h-[52px] ${(loading || success) ? 'opacity-60' : ''}`}
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
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-3 text-sm text-gray-500 bg-gray-50">Or continue with</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>
                <GoogleLoginButton />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(700).duration(400)}>
              <TouchableOpacity
                className="mt-2 items-center"
                onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-sm text-green-600 font-medium">Forgot your password?</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



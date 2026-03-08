import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import GoogleSignupButton from '../../components/GoogleSignupButton';
import { GOOGLE_CLIENT_ID } from '../../config/env';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function SignupScreen() {
  const { setToken } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone)) {
      setError('Valid 10-digit phone number is required (starting with 6-9)');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/checkout/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to send OTP';
        try {
          const errorData = await res.json();
          const apiError = errorData.error || errorData.message;
          if (apiError) {
            if (apiError.includes('wait') || apiError.includes('rate limit') || res.status === 429) {
              errorMessage = 'Too many requests. Please wait a minute before requesting another OTP.';
              const retryAfter = errorData.retry_after || 60;
              setCooldown(retryAfter);
            } else {
              errorMessage = apiError;
            }
          }
        } catch {
          if (res.status === 429) {
            errorMessage = 'Too many requests. Please wait a minute before requesting another OTP.';
            setCooldown(60);
          }
        }
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return;
      }

      await res.text();
      Alert.alert('Success', 'Verification code sent to your email!');
      setOtpSent(true);
      setCooldown(60);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send verification email. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await apiFetch('/checkout/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, otp }),
      });

      if (!res.ok) {
        let errorMessage = 'Invalid OTP';
        try {
          const errorData = await res.json();
          const apiError = errorData.error || errorData.message;
          if (apiError) {
            if (apiError.includes('expired')) {
              errorMessage = 'OTP has expired. Please request a new one.';
            } else if (apiError.includes('invalid') || apiError.includes('incorrect')) {
              errorMessage = 'Invalid OTP. Please check and try again.';
            } else {
              errorMessage = apiError;
            }
          }
        } catch {
          // Use default message
        }
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return;
      }

      await res.text();
      Alert.alert('Success', 'Email verified successfully!');
      setEmailVerified(true);
      await handleSignup();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid OTP. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use default message
        }
        setError(errorMessage);
        Alert.alert('Signup Failed', errorMessage);
        return;
      }

      const data = await res.json();
      setToken(data.token);
      Alert.alert('Success', 'Account created successfully! Welcome!');
      setSuccess(true);
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(200)}>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
        <MaterialIcons name="person" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(text) => {
            setFormData({ ...formData, name: text });
            setError(null);
          }}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
        <MaterialIcons name="email" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => {
            setFormData({ ...formData, email: text });
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
        <MaterialIcons name="phone" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Phone (10 digits)"
          value={formData.phone}
          onChangeText={(text) => {
            setFormData({ ...formData, phone: text.replace(/\D/g, '').slice(0, 10) });
            setError(null);
          }}
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
        <MaterialIcons name="lock" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => {
            setFormData({ ...formData, password: text });
            setError(null);
          }}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 mb-4">
        <MaterialIcons name="lock" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => {
            setFormData({ ...formData, confirmPassword: text });
            setError(null);
          }}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        className={`bg-green-600 p-4 rounded-xl items-center justify-center min-h-[52px] ${loading || cooldown > 0 ? 'opacity-60' : ''}`}
        onPress={handleSendOTP}
        disabled={loading || cooldown > 0}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Send Verification Code'}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOTPVerification = () => (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(200)}>
      <View className="items-center mb-4">
        <Text className="text-sm text-gray-500 mb-4 text-center">
          Enter the 6-digit code sent to {formData.email}
        </Text>
        <TextInput
          className="w-full bg-white border border-gray-200 rounded-xl p-5 text-[32px] font-bold tracking-[8px] text-center text-gray-900"
          placeholder="000000"
          value={otp}
          onChangeText={(text) => {
            setOtp(text.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center p-4 border border-gray-300 rounded-xl bg-white gap-2"
          onPress={() => {
            setOtpSent(false);
            setOtp('');
            setError(null);
          }}>
          <MaterialIcons name="arrow-back" size={20} color="#374151" />
          <Text className="text-base font-semibold text-gray-700">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 bg-green-600 p-4 rounded-xl items-center justify-center min-h-[52px] ${(verifyingOtp || otp.length !== 6) ? 'opacity-60' : ''}`}
          onPress={handleVerifyOTP}
          disabled={verifyingOtp || otp.length !== 6}>
          {verifyingOtp ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-semibold text-white">Verify Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center p-6">
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-green-600 items-center justify-center">
              <MaterialIcons name="person-add" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text className="text-[28px] font-bold text-gray-900 mb-2 text-center">Create your account</Text>
            <Text className="text-sm text-gray-500 mb-8 text-center">
              Already have an account?{' '}
              <Text className="text-green-600 font-semibold" onPress={() => router.push('/(auth)/login')}>
                Sign in
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
                <Text className="flex-1 text-sm text-green-600">Account created successfully! Redirecting...</Text>
              </Animated.View>
            )}

            {!otpSent ? renderFormFields() : renderOTPVerification()}

            {GOOGLE_CLIENT_ID && !otpSent && (
              <Animated.View entering={FadeInDown.delay(600).duration(400)}>
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-3 text-sm text-gray-500 bg-gray-50">Or continue with</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>
                <GoogleSignupButton />
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React ,{ useState } from 'react';
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
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { showAlert } from '../../components/Alert';
import { apiFetch } from '../../lib/api';
import { UI } from '../../lib/ui';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setSendingOtp(true);

    try {
      const res = await apiFetch('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to send OTP';
        try {
          const errorData = await res.json();
          const apiError = errorData.error || errorData.message;
          if (apiError) {
            if (apiError.includes('wait') || apiError.includes('rate limit') || res.status === 429) {
              errorMessage = 'Too many requests. Please wait a minute before requesting another OTP.';
            } else if (apiError.includes('not found') || apiError.includes('does not exist')) {
              errorMessage = 'No account found with this email address.';
            } else {
              errorMessage = apiError;
            }
          }
        } catch {
          if (res.status === 429) {
            errorMessage = 'Too many requests. Please wait a minute before requesting another OTP.';
          }
        }
        setError(errorMessage);
        showAlert('Error', errorMessage);
        return;
      }

      await res.text();
      showAlert('Success', 'OTP sent to your email!');
      setStep('otp');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/forgot-password/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
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
        showAlert('Error', errorMessage);
        return;
      }

      await res.text();
      showAlert('Success', 'OTP verified successfully!');
      setStep('reset');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired OTP';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      const errorMsg = 'Password must be at least 6 characters';
      setError(errorMsg);
      showAlert('Error', errorMsg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      showAlert('Error', errorMsg);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to reset password';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use default message
        }
        setError(errorMessage);
        showAlert('Error', errorMessage);
        return;
      }

      await res.text();
      showAlert('Success', 'Password reset successfully!.');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(200)}>
      <View
        className="flex-row items-center rounded-2xl px-4 mb-4"
        style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
        <MaterialIcons name="email" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        className={`p-4 rounded-2xl items-center justify-center min-h-[52px] ${sendingOtp ? 'opacity-60' : ''}`}
        style={{ backgroundColor: UI.color.primaryDark }}
        onPress={handleSendOTP}
        disabled={sendingOtp}>
        {sendingOtp ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-semibold text-white">Send Verification Code</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(200)}>
      <View className="items-center mb-4">
        <TextInput
          className="w-full rounded-2xl p-5 text-[32px] tracking-[8px] text-center"
          style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border, color: UI.color.ink, fontFamily: UI.font.displayBold }}
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
        <Text className="mt-3 text-xs text-gray-500 text-center">
          Enter the 6-digit code sent to {email}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center p-4 rounded-2xl gap-2"
          style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}
          onPress={() => {
            setStep('email');
            setOtp('');
            setError(null);
          }}>
          <MaterialIcons name="arrow-back" size={20} color="#374151" />
          <Text className="text-base font-semibold text-gray-700">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 p-4 rounded-2xl items-center justify-center min-h-[52px] ${(loading || otp.length !== 6) ? 'opacity-60' : ''}`}
          style={{ backgroundColor: UI.color.primaryDark }}
          onPress={handleVerifyOTP}
          disabled={loading || otp.length !== 6}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-semibold text-white">Verify Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderResetStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(200)}>
      <View
        className="flex-row items-center rounded-2xl px-4 mb-4"
        style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
        <MaterialIcons name="lock" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900 pr-2"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setError(null);
          }}
          secureTextEntry={!showPassword}
          placeholderTextColor="#9CA3AF"
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

      <View
        className="flex-row items-center rounded-2xl px-4 mb-4"
        style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}>
        <MaterialIcons name="lock" size={20} color="#9CA3AF" className="mr-3" />
        <TextInput
          className="flex-1 py-4 text-base text-gray-900 pr-2"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError(null);
          }}
          secureTextEntry={!showConfirmPassword}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword((p) => !p)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons
            name={showConfirmPassword ? 'visibility-off' : 'visibility'}
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center p-4 rounded-2xl gap-2"
          style={{ backgroundColor: UI.color.surface, borderWidth: 1, borderColor: UI.color.border }}
          onPress={() => {
            setStep('otp');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
          }}>
          <MaterialIcons name="arrow-back" size={20} color="#374151" />
          <Text className="text-base font-semibold text-gray-700">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 p-4 rounded-2xl items-center justify-center min-h-[52px] ${(loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 'opacity-60' : ''}`}
          style={{ backgroundColor: UI.color.primaryDark }}
          onPress={handleResetPassword}
          disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-semibold text-white">Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: UI.color.canvasAlt }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center p-6">
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text
              className="text-[28px] mb-2 text-center"
              style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
              {step === 'email' && 'Forgot password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset password'}
            </Text>
            <Text className="text-sm text-gray-500 mb-8 text-center">
              {step === 'email' && "Enter your email address and we'll send you a verification code"}
              {step === 'otp' && 'Enter the verification code sent to your email'}
              {step === 'reset' && 'Enter your new password'}
            </Text>
          </Animated.View>

          {error && (
            <Animated.View entering={FadeInDown.duration(200)} className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 mb-4 gap-2">
              <MaterialIcons name="error" size={20} color="#DC2626" />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </Animated.View>
          )}

          <View className="gap-4">
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOTPStep()}
            {step === 'reset' && renderResetStep()}
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center mt-6 gap-1.5"
            onPress={() => router.push('/(auth)/login')}>
            <MaterialIcons name="arrow-back" size={16} color={UI.color.primary} />
            <Text className="text-sm font-medium" style={{ color: UI.color.primary }}>
              Back to login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


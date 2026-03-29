import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { GOOGLE_CLIENT_ID } from '../config/env';
import { apiFetch } from '../lib/api';
import { clearGoogleSessionForAccountPicker, signInForIdToken } from '../lib/googleSignInHelpers';
import { useAuthStore } from '../store/authStore';

export default function GoogleSignupButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);

  const handleGoogleSignup = async () => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    try {
      setLoading(true);

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      await clearGoogleSessionForAccountPicker();

      const signInResult = await signInForIdToken();
      if (signInResult.kind === 'cancelled') {
        return;
      }
      if (signInResult.kind === 'failed') {
        router.replace('/(auth)');
        return;
      }
      const { idToken } = signInResult;

      const res = await apiFetch('/auth/google-signup', {
        method: 'POST',
        body: JSON.stringify({ token: idToken }),
      });

      if (!res.ok) {
        router.replace('/(auth)');
        return;
      }

      const data = await res.json();
      setToken(data.token);
      router.replace('/(tabs)/home');
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
      if (code === String(statusCodes.SIGN_IN_CANCELLED)) {
        return;
      }
      console.error('Google signup error:', error);
      router.replace('/(auth)');
    } finally {
      setLoading(false);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <TouchableOpacity
      className={`w-full flex-row items-center justify-center py-3.5 px-4 border-2 border-gray-300 rounded-xl bg-white ${loading ? 'opacity-60' : ''}`}
      onPress={handleGoogleSignup}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#374151" />
      ) : (
        <View className="flex-row items-center gap-3">
          <View className="w-5 h-5 items-center justify-center bg-white rounded-[10px]">
            <Text className="text-sm font-bold text-blue-500">G</Text>
          </View>
          <Text className="text-base font-semibold text-gray-700">Sign up with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

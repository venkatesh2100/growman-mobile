import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_CLIENT_ID } from '../config/env';
import { useRouter } from 'expo-router';

export default function GoogleLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    // Configure Google Sign In
    if (GOOGLE_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);
  // In GoogleLoginButton.tsx or wherever you configure
// console.log('Using webClientId:', GOOGLE_CLIENT_ID)

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    try {
      setLoading(true);

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      // console.log('userInfo', userInfo);
      if (userInfo?.data?.idToken) {
        // Send token to backend for verification
        const res = await apiFetch('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ token: userInfo.data.idToken }),
        });

        // const res = await apiFetch("/auth/google", {
        //   method: "POST",
        //   body: JSON.stringify({ token: tokenResponse.access_token }),
        // });

        if (!res.ok) {
          // User doesn't exist, redirect to signup
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 404 || errorData.error?.includes('not exist')) {
            // Navigate to signup screen
            router.push('/signup');
            return;
          }
          throw new Error('Google login failed');
        }

        const data = await res.json();
        setToken(data.token);
        // Navigation will automatically switch to Main stack
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.log(error);
      console.error('Google login error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // console.log('User cancelled Google sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // console.log('Google sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // console.log('Play services not available');
      } else {
        // console.log('Google sign in error:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured');
    return null;
  }

  return (
    <TouchableOpacity
      className={`w-full flex-row items-center justify-center py-3.5 px-4 border-2 border-gray-300 rounded-xl bg-white ${loading ? 'opacity-60' : ''}`}
      onPress={handleGoogleLogin}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#374151" />
      ) : (
        <View className="flex-row items-center gap-3">
          <View className="w-5 h-5 items-center justify-center bg-white rounded-[10px]">
            <Text className="text-sm font-bold text-blue-500">G</Text>
          </View>
          <Text className="text-base font-semibold text-gray-700">Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

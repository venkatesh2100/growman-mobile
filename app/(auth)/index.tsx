import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { UI } from '../../lib/ui';

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 700;
  const setToken = useAuthStore((s) => s.setToken);
  const [truecallerReady, setTruecallerReady] = useState(false);
  const [truecallerLoading, setTruecallerLoading] = useState(false);

  useEffect(() => {
    if (!isTruecallerConfigured()) return;
    void ensureTruecallerReady().then(setTruecallerReady);
  }, []);

  const handleTruecaller = async () => {
    setTruecallerLoading(true);
    try {
      const result = await signInWithTruecaller();
      if (!result.ok) return;
      setToken(result.token);
      router.replace(result.isNewUser ? '/(auth)/complete-profile' : '/(tabs)/home');
    } finally {
      setTruecallerLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: insets.top + (compact ? 16 : 24),
        paddingBottom: insets.bottom + 24,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View
        className="flex-1 justify-between"
        style={{ minHeight: Math.max(0, windowHeight - insets.top - insets.bottom - 48) }}>
        <Animated.View
          entering={FadeIn.duration(350)}
          className={`items-center ${compact ? 'mt-2 mb-6' : 'mt-6 mb-10'}`}>
          <Image
            source={require('../../assets/images/icon.png')}
            className={compact ? 'w-16 h-16 rounded-md' : 'w-20 h-20 rounded-md'}
            resizeMode="cover"
            accessibilityLabel="Growman logo"
          />
          <Text className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mt-5 text-center`}>
            Growman
          </Text>
          <Text className={`${compact ? 'text-sm' : 'text-base'} text-gray-500 mt-2 text-center px-2`}>
            Plants, supplies, and care — continue with your mobile number.
          </Text>
        </Animated.View>

        <View className="w-full">
          {truecallerReady ? (
            <TouchableOpacity
              className={`bg-[#0087FF] p-4 rounded-2xl flex-row items-center justify-center min-h-[56px] shadow-md mb-3 ${truecallerLoading ? 'opacity-70' : ''}`}
              style={{ gap: 8 }}
              activeOpacity={0.9}
              disabled={truecallerLoading}
              onPress={handleTruecaller}>
              {truecallerLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialIcons name="verified-user" size={22} color="#FFFFFF" />
              )}
              <Text className="text-base font-semibold text-white text-center">
                {truecallerLoading ? 'Opening Truecaller…' : 'Continue with Truecaller'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            className="bg-green-600 p-4 rounded-2xl flex-row items-center justify-center min-h-[56px] shadow-md"
            style={{ gap: 8 }}
            activeOpacity={0.9}
            disabled={truecallerLoading}
            onPress={() => router.push('/(auth)/phone')}>
            <MaterialIcons name="smartphone" size={22} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white text-center">
              {truecallerReady ? 'Continue with SMS OTP' : 'Continue with mobile number'}
            </Text>
          </TouchableOpacity>

          {GOOGLE_CLIENT_ID ? (
            <View className="mt-5">
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-3 text-sm text-gray-500">Or continue with</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
              <GoogleLoginButton />
            </View>
          ) : null}

          <TouchableOpacity className="mt-6 items-center" onPress={() => router.push('/(auth)/login')} hitSlop={10}>
            <Text className="text-sm text-gray-500">
              Trouble signing in? <Text className="text-green-600 font-semibold">Use email</Text>
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-8 px-2">
            By continuing, you agree to our terms and privacy practices.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

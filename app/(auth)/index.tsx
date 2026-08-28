import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { GOOGLE_CLIENT_ID } from '../../config/env';
import { UI } from '../../lib/ui';
import { useLocationPrompt } from '../../lib/useLocationPrompt';
import { ensureTruecallerReady, isTruecallerConfigured, signInWithTruecaller } from '../../lib/truecaller';
import { useAuthStore } from '../../store/authStore';

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 700;
  const heroHeight = Math.max(compact ? 210 : 260, Math.round(windowHeight * 0.32));
  const setToken = useAuthStore((s) => s.setToken);
  const [truecallerReady, setTruecallerReady] = useState(false);
  const [truecallerLoading, setTruecallerLoading] = useState(false);

  useLocationPrompt(true);

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
    <View className="flex-1" style={{ backgroundColor: UI.color.surface }}>
      <View style={{ height: heroHeight + insets.top, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#064e3b', '#047857', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, paddingTop: insets.top }}>
          <MaterialIcons
            name="eco"
            size={220}
            color="rgba(255,255,255,0.08)"
            style={{ position: 'absolute', right: -50, top: -30, transform: [{ rotate: '18deg' }] }}
          />
          <Animated.View entering={FadeIn.duration(400)} className="flex-1 items-center justify-center px-8">
            <Image
              source={require('../../assets/images/icon.png')}
              className="w-16 h-16 rounded-2xl mb-4"
              resizeMode="cover"
              accessibilityLabel="Growman logo"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
              }}
            />
            <Text
              className="text-[30px] text-center"
              style={{ color: '#FFFFFF', fontFamily: UI.font.displayBlack }}>
              Growman
            </Text>
            <Text
              className="text-[14px] text-center mt-1.5"
              style={{ color: 'rgba(255,255,255,0.82)', fontFamily: UI.font.displayItalic }}>
              Plants, delivered with care.
            </Text>
          </Animated.View>
        </LinearGradient>
      </View>

      <ScrollView
        className="flex-1"
        style={{ marginTop: -22 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInUp.delay(120).duration(380)}
          className="flex-1 justify-between rounded-t-[24px]"
          style={{ backgroundColor: UI.color.surface }}>
          <View>
            <Text className="text-[13px] text-center mb-5" style={{ color: UI.color.muted }}>
              Sign in or create an account to continue
            </Text>

            {truecallerReady ? (
              <TouchableOpacity
                className={`bg-[#0087FF] p-4 rounded-2xl flex-row items-center justify-center min-h-[56px] mb-3 ${truecallerLoading ? 'opacity-70' : ''}`}
                style={{ gap: 8 }}
                activeOpacity={0.9}
                disabled={truecallerLoading}
                onPress={handleTruecaller}>
                {truecallerLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                )}
                <Text className="text-[15px] font-semibold text-white text-center">
                  {truecallerLoading ? 'Opening Truecaller…' : 'Continue with Truecaller'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              className="p-4 rounded-2xl flex-row items-center justify-center min-h-[56px]"
              style={{ gap: 8, backgroundColor: UI.color.primaryDark }}
              activeOpacity={0.9}
              disabled={truecallerLoading}
              onPress={() => router.push('/(auth)/phone')}>
              <MaterialIcons name="smartphone" size={20} color="#FFFFFF" />
              <Text className="text-[15px] font-semibold text-white text-center">
                {truecallerReady ? 'Continue with SMS OTP' : 'Continue with mobile number'}
              </Text>
            </TouchableOpacity>

            {GOOGLE_CLIENT_ID ? (
              <View className="mt-5">
                <View className="flex-row items-center mb-4">
                  <View className="flex-1 h-px" style={{ backgroundColor: UI.color.border }} />
                  <Text className="mx-3 text-xs" style={{ color: UI.color.muted }}>
                    Or continue with
                  </Text>
                  <View className="flex-1 h-px" style={{ backgroundColor: UI.color.border }} />
                </View>
                <GoogleLoginButton />
              </View>
            ) : null}

            <TouchableOpacity className="mt-6 items-center" onPress={() => router.push('/(auth)/login')} hitSlop={10}>
              <Text className="text-sm" style={{ color: UI.color.muted }}>
                Trouble signing in?{' '}
                <Text className="font-semibold" style={{ color: UI.color.primary }}>
                  Use email
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-center mt-8 px-2" style={{ color: '#9CA3AF' }}>
            By continuing, you agree to our terms and privacy practices.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

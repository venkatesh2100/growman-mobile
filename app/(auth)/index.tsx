import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { UI } from '../../lib/ui';

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 700;

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
      <View className="flex-1 justify-between" style={{ minHeight: Math.max(0, windowHeight - insets.top - insets.bottom - 48) }}>
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
            Plants, supplies, and care — sign in or create an account in a few steps.
          </Text>
        </Animated.View>

        <View className="w-full">
          <TouchableOpacity
            className="bg-green-600 p-4 rounded-2xl flex-row items-center justify-center min-h-[56px] shadow-md"
            style={{ gap: 8 }}
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/login')}>
            <MaterialIcons name="login" size={22} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white text-center">Already a customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border-2 border-green-600 p-4 rounded-2xl flex-row items-center justify-center min-h-[56px] mt-4"
            style={{ gap: 8, borderColor: UI.color.primary }}
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/signup')}>
            <MaterialIcons name="person-add" size={22} color={UI.color.primary} />
            <Text
              className="text-base font-semibold text-green-700 text-center flex-shrink"
              numberOfLines={2}>
              New customer · Create account
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

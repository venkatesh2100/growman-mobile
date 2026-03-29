import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + 24,
        paddingTop: insets.top + 24,
      }}
      showsVerticalScrollIndicator={false}>
      <View className="flex-1 px-6 justify-center min-h-[480px]">
        <Animated.View entering={FadeInDown.delay(80).duration(400)} className="items-center mb-10">
          <Image
            source={require('../../assets/images/icon.png')}
            className="w-20 h-20 rounded-md"
            resizeMode="cover"
            accessibilityLabel="Growman logo"
          />
          <Text className="text-3xl font-bold text-gray-900 mt-6 text-center">Growman</Text>
          <Text className="text-base text-gray-500 mt-2 text-center px-4">
            Plants, supplies, and care — sign in or create an account in a few steps.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(400)} className="gap-4">
          <TouchableOpacity
            className="bg-green-600 p-4 rounded-2xl flex-row items-center justify-center gap-2 min-h-[56px] shadow-md"
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/login')}>
            <MaterialIcons name="login" size={22} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">Already a customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border-2 border-green-600 p-4 rounded-2xl flex-row items-center justify-center gap-2 min-h-[56px]"
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/signup')}>
            <MaterialIcons name="person-add" size={22} color="#059669" />
            <Text className="text-base font-semibold text-green-700">New customer · Create account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Text className="text-xs text-gray-400 text-center mt-10 px-6">
            By continuing, you agree to our terms and privacy practices.
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

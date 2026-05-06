import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openChatbot } from '../lib/chatbotOpener';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const handleAskDootha = () => {
    const message = orderId
      ? `Hi Dootha, I need delivery support for order #${orderId}. Please share support contact details and help me escalate this delay.`
      : "Hi Dootha, I need delivery support. Please share support contact details and help me escalate this issue.";
    router.push('/(tabs)/home');
    setTimeout(() => openChatbot(message), 180);
  };

  return (
    <View className="flex-1 bg-[#F0F7F4]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Order Support</Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900">Need help with delivery?</Text>
          <Text className="text-sm text-gray-600 mt-2">
            Share your issue with Dootha AI first for quick guidance. If still unresolved, contact Growman support.
          </Text>
          {orderId ? (
            <View className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
              <Text className="text-xs text-emerald-700">Order reference</Text>
              <Text className="text-sm font-semibold text-emerald-900">#{orderId}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 bg-emerald-700 rounded-2xl py-3.5 active:opacity-90 mb-3"
          onPress={handleAskDootha}
        >
          <MaterialIcons name="auto-awesome" size={20} color="#fff" />
          <Text className="text-base font-semibold text-white">Ask Dootha AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4 border border-gray-200 mb-3"
          onPress={() => Linking.openURL('mailto:growman.live@gmail.com')}
        >
          <MaterialIcons name="email" size={22} color="#059669" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900">Email support</Text>
            <Text className="text-sm text-gray-600">growman.live@gmail.com</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4 border border-gray-200"
          onPress={() => router.push('/orders')}
        >
          <MaterialIcons name="receipt-long" size={22} color="#059669" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900">Go to My Orders</Text>
            <Text className="text-sm text-gray-600">Track and view full order details</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

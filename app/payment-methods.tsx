import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Payment Methods</Text>
      </View>
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
          <MaterialIcons name="credit-card" size={40} color="#059669" />
        </View>
        <Text className="text-lg font-medium text-gray-600 text-center mb-2">Secure payments with Razorpay</Text>
        <Text className="text-sm text-gray-500 text-center">
          Pay securely at checkout with UPI, cards, net banking, and wallets. No need to save payment methods.
        </Text>
      </View>
    </View>
  );
}

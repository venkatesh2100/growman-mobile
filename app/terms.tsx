import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Terms & Conditions</Text>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6">
          <Text className="text-sm text-gray-600 leading-6">
            By using Growman, you agree to these terms.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Orders</Text>
            {'\n'}
            All orders are subject to availability. We reserve the right to cancel orders in case of errors or stock issues.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Pricing</Text>
            {'\n'}
            Prices are in INR and include GST where applicable. Delivery charges may apply based on location.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Returns</Text>
            {'\n'}
            Plants are living products. Please contact us within 48 hours of delivery if there is an issue. Refunds are processed per our return policy.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Contact</Text>
            {'\n'}
            For any queries, email support@growman.in.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

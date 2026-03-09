import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();

  const faqs = [
    { q: 'How do I track my order?', a: 'After placing an order, you\'ll receive a confirmation. Track status in My Orders.' },
    { q: 'What is your return policy?', a: 'Plants are living products. Contact us within 48 hours if there\'s an issue with delivery.' },
    { q: 'How do I care for my plants?', a: 'Each product page has care instructions. You can also chat with Dootha, our plant care assistant.' },
    { q: 'Do you deliver nationwide?', a: 'Yes, we deliver across India. Delivery time varies by location.' },
  ];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Help Center</Text>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Frequently Asked Questions</Text>
          {faqs.map((faq, i) => (
            <View key={i} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0">
              <Text className="text-sm font-medium text-gray-800 mb-1">{faq.q}</Text>
              <Text className="text-sm text-gray-500">{faq.a}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4"
          onPress={() => Linking.openURL('mailto:support@growman.in')}>
          <MaterialIcons name="email" size={24} color="#059669" />
          <View className="ml-4 flex-1">
            <Text className="text-base font-medium text-gray-900">Email Support</Text>
            <Text className="text-sm text-gray-500">support@growman.in</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

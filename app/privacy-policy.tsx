import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Privacy Policy</Text>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6">
          <Text className="text-sm text-gray-600 leading-6">
            Growman ("we", "our") respects your privacy. This policy describes how we collect, use, and protect your information.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Information we collect</Text>
            {'\n'}
            We collect information you provide: name, email, phone, and delivery address for order fulfillment. Payment details are processed securely by Razorpay and we do not store card numbers.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">How we use it</Text>
            {'\n'}
            Your data is used to process orders, communicate updates, and improve our services. We do not sell your information to third parties.
            {'\n\n'}
            <Text className="font-semibold text-gray-900">Data security</Text>
            {'\n'}
            We use industry-standard measures to protect your data. For questions, contact support@growman.in.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

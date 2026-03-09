import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '../components/Toast';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Notifications</Text>
      </View>
      <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
          <View>
            <Text className="text-base font-medium text-gray-900">Order Updates</Text>
            <Text className="text-sm text-gray-500">Track your orders and delivery status</Text>
          </View>
          <Switch
            value={orderUpdates}
            onValueChange={setOrderUpdates}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>
        <View className="flex-row justify-between items-center p-4">
          <View>
            <Text className="text-base font-medium text-gray-900">Promotions & Offers</Text>
            <Text className="text-sm text-gray-500">Get exclusive deals and new arrivals</Text>
          </View>
          <Switch
            value={promotions}
            onValueChange={(v) => {
              setPromotions(v);
              toast('Preferences will sync when backend is configured', 'info');
            }}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );
}

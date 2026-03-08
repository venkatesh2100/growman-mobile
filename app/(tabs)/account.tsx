import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiFetch } from '../../lib/api';
import { User } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { clearAuth, token } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await apiFetch('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top }}>
      {/* Profile Section */}
      <Animated.View entering={FadeInDown.duration(400)} className="bg-white p-8 items-center mb-4">
        <View className="relative mb-4">
          <View className="w-24 h-24 rounded-full bg-green-100 justify-center items-center">
            <MaterialIcons name="person" size={48} color="#059669" />
          </View>
          <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 justify-center items-center border-[3px] border-white">
            <MaterialIcons name="edit" size={16} color="#FFFFFF" />
          </View>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.name || 'User'}</Text>
        <Text className="text-base text-gray-500 mb-1">{user?.email || ''}</Text>
        {user?.phone && <Text className="text-sm text-gray-400">{user.phone}</Text>}
      </Animated.View>

      {/* Quick Actions */}
      <View className="mb-4 px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Quick Actions</Text>
        <View className="flex-row justify-between gap-3">
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl p-4 items-center shadow-md"
            onPress={() => router.push('/orders')}>
            <View className="w-14 h-14 rounded-full bg-green-100 justify-center items-center mb-2">
              <MaterialIcons name="shopping-bag" size={24} color="#059669" />
            </View>
            <Text className="text-[13px] font-semibold text-gray-900">Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-md">
            <View className="w-14 h-14 rounded-full bg-blue-100 justify-center items-center mb-2">
              <MaterialIcons name="favorite" size={24} color="#3B82F6" />
            </View>
            <Text className="text-[13px] font-semibold text-gray-900">Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-md">
            <View className="w-14 h-14 rounded-full bg-yellow-100 justify-center items-center mb-2">
              <MaterialIcons name="card-giftcard" size={24} color="#F59E0B" />
            </View>
            <Text className="text-[13px] font-semibold text-gray-900">Coupons</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Section */}
      <View className="mb-4 px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Account</Text>
        <View className="bg-white rounded-2xl overflow-hidden">
          <TouchableOpacity
            className="flex-row justify-between items-center p-4 border-b border-gray-100"
            onPress={() => router.push('/orders')}>
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="shopping-bag" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">My Orders</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="location-on" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Saved Addresses</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="payment" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Payment Methods</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center p-4">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="notifications" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Notifications</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Section */}
      <View className="mb-4 px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Support</Text>
        <View className="bg-white rounded-2xl overflow-hidden">
          <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="help" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Help Center</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="privacy-tip" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center p-4">
            <View className="flex-row items-center gap-4 flex-1">
              <MaterialIcons name="description" size={24} color="#059669" />
              <Text className="text-base text-gray-900 font-medium">Terms & Conditions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View className="mb-8 px-4">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white p-4 rounded-2xl gap-3 border border-red-200"
          onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text className="text-base font-semibold text-red-500">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}



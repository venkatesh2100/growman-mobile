import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AccountSkeleton } from '../../components/skeletons/AccountSkeleton';
import { toast } from '../../components/Toast';
import { apiFetch } from '../../lib/api';
import { User } from '../../lib/types';
import { showConfirm } from '../../components/Alert';
import { useAuthStore } from '../../store/authStore';
import { UI } from '../../lib/ui';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { clearAuth, token } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    loadUser();
  }, [token, loadUser]);

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  if (token && loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt, paddingTop: insets.top }}>
        <AccountSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <View
        style={{ height: insets.top, backgroundColor: UI.color.canvasAlt }}
        className="absolute top-0 left-0 right-0 z-10"
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}>
        <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-6 items-center mb-6">
          <View className="relative mb-4">
            <View
              className="w-24 h-24 rounded-full justify-center items-center border-2 border-emerald-100"
              style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}>
              <MaterialIcons name="person" size={48} color={UI.color.primary} />
            </View>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.name ?? 'Guest'}</Text>
          {user?.email ? <Text className="text-base text-gray-600 mb-1">{user.email}</Text> : null}
          {user?.phone ? <Text className="text-sm text-gray-500">{user.phone}</Text> : null}
          {!token && (
            <TouchableOpacity
              className="mt-4 px-8 py-3 rounded-2xl bg-emerald-700 active:opacity-90"
              onPress={() => router.push('/(auth)/login')}>
              <Text className="text-base font-semibold text-white">Sign in</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {token && (
          <>
            <View className="mb-4 px-4">
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Quick actions</Text>
              <View className="flex-row justify-between gap-3">
                <TouchableOpacity
                  className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 active:opacity-90"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => router.push('/orders')}>
                  <View
                    className="w-12 h-12 rounded-full justify-center items-center mb-2"
                    style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                    <MaterialIcons name="shopping-bag" size={UI.icon.md} color={UI.color.primary} />
                  </View>
                  <Text className="text-[13px] font-semibold text-gray-900">Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 active:opacity-90"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => router.push('/wishlist')}>
                  <View
                    className="w-12 h-12 rounded-full justify-center items-center mb-2"
                    style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                    <MaterialIcons name="favorite-border" size={UI.icon.md} color={UI.color.primary} />
                  </View>
                  <Text className="text-[13px] font-semibold text-gray-900">Wishlist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 active:opacity-90"
                  onPress={() => toast('Coming soon', 'info')}>
                  <View
                    className="w-12 h-12 rounded-full justify-center items-center mb-2"
                    style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                    <MaterialIcons name="local-offer" size={UI.icon.md} color={UI.color.primary} />
                  </View>
                  <Text className="text-[13px] font-semibold text-gray-900">Offers</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4 px-4">
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Account</Text>
              <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {(
                  [
                    { icon: 'shopping-bag' as const, label: 'My orders', path: '/orders' as const },
                    { icon: 'location-on' as const, label: 'Saved addresses', path: '/saved-addresses' as const },
                    { icon: 'payment' as const, label: 'Payment methods', path: '/payment-methods' as const },
                    { icon: 'notifications-none' as const, label: 'Notifications', path: '/notifications' as const },
                  ] as const
                ).map((row, idx) => (
                  <TouchableOpacity
                    key={row.path}
                    className={`flex-row justify-between items-center p-4 ${idx < 3 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => router.push(row.path)}>
                    <View className="flex-row items-center gap-3 flex-1">
                      <MaterialIcons name={row.icon} size={UI.icon.lg} color={UI.color.primary} />
                      <Text className="text-base text-gray-900 font-medium">{row.label}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={UI.icon.lg} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4 px-4">
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Support</Text>
              <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {(
                  [
                    { icon: 'help-outline' as const, label: 'Help center', path: '/help-center' as const },
                    { icon: 'privacy-tip' as const, label: 'Privacy policy', path: '/privacy-policy' as const },
                    { icon: 'description' as const, label: 'Terms & conditions', path: '/terms' as const },
                  ] as const
                ).map((row, idx) => (
                  <TouchableOpacity
                    key={row.path}
                    className={`flex-row justify-between items-center p-4 ${idx < 2 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => router.push(row.path)}>
                    <View className="flex-row items-center gap-3 flex-1">
                      <MaterialIcons name={row.icon} size={UI.icon.lg} color={UI.color.primary} />
                      <Text className="text-base text-gray-900 font-medium">{row.label}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={UI.icon.lg} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="px-4 mb-6">
              <TouchableOpacity
                className="flex-row items-center justify-center bg-white p-4 rounded-2xl gap-2 border border-red-200 active:opacity-90"
                onPress={handleLogout}>
                <MaterialIcons name="logout" size={UI.icon.lg} color="#EF4444" />
                <Text className="text-base font-semibold text-red-500">Log out</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

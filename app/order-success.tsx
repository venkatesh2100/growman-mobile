import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../lib/api';

interface Order {
  id: string | number;
  amount: number;
  status?: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
}

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch(`/order?id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

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
      contentContainerStyle={{ paddingTop: insets.top }}>
      <View className="max-w-2xl mx-auto px-4 py-12">
        <View className="bg-white rounded-xl shadow-lg p-8">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
              <MaterialIcons name="check-circle" size={48} color="#059669" />
            </View>
          </View>

          <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Order Placed Successfully!
          </Text>
          <Text className="text-base text-gray-600 mb-6 text-center">
            Thank you for your purchase. Your order has been confirmed.
          </Text>

          {order && (
            <View className="bg-gray-50 rounded-lg p-6 mb-6">
              <View className="space-y-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Order ID:</Text>
                  <Text className="text-sm font-semibold text-gray-900">#{order.id}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Amount:</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    ₹{order.amount.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Status:</Text>
                  <Text className="text-sm font-semibold text-green-600 capitalize">
                    {order.paymentStatus === 'paid' || order.status === 'paid' ? 'Paid' : order.status || order.paymentStatus || 'Pending'}
                  </Text>
                </View>
                {order.razorpayPaymentId && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Payment ID:</Text>
                    <Text className="text-xs font-mono text-gray-900">
                      {order.razorpayPaymentId.slice(0, 20)}...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="flex-row gap-4 justify-center mb-8">
            <TouchableOpacity
              className="bg-green-600 px-6 py-3 rounded-lg active:bg-green-700 flex-row items-center"
              onPress={() => router.push('/(tabs)/shop')}>
              <MaterialIcons name="shopping-bag" size={20} color="#FFFFFF" />
              <Text className="text-base font-medium text-white ml-2">Continue Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-200 px-6 py-3 rounded-lg active:bg-gray-300 flex-row items-center"
              onPress={() => router.push('/(tabs)/home')}>
              <MaterialIcons name="home" size={20} color="#374151" />
              <Text className="text-base font-medium text-gray-800 ml-2">Go Home</Text>
            </TouchableOpacity>
          </View>

          <View className="pt-6 border-t border-gray-200">
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="local-shipping" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                You will receive an order confirmation email shortly.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}



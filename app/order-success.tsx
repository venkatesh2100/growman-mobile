import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../components/Loading';
import { apiFetch } from '../lib/api';

interface Order {
  id: string | number;
  amount: number;
  createdAt?: string;
  status?: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

const ORDER_PROGRESS_STEPS = [
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function deliveryEta(createdAt?: string) {
  const base = createdAt ? new Date(createdAt) : new Date();
  base.setDate(base.getDate() + 7);
  return base;
}

function progressIndex(order: Order): number {
  const s = (order.status || '').toLowerCase();
  const p = (order.paymentStatus || '').toLowerCase();
  if (s === 'delivered') return 3;
  if (s === 'out_for_delivery') return 2;
  if (s === 'shipped') return 1;
  if (s === 'confirmed' || s === 'paid' || p === 'paid') return 0;
  if (s === 'cancelled' || s === 'failed' || p === 'failed') return -1;
  return 0;
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
    return <Loading />;
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F0F7F4]"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-2xl mx-auto px-4 py-6">
        <View className="bg-white rounded-2xl border border-gray-200 p-5">
          <View className="items-center mb-5">
            <View className="w-20 h-20 rounded-full items-center justify-center bg-emerald-100">
              <MaterialIcons name="check-circle" size={50} color="#059669" />
            </View>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Order Placed Successfully!
          </Text>
          <Text className="text-sm text-gray-600 mb-6 text-center">
            Thanks for shopping with Growman. Your order is confirmed and being processed.
          </Text>

          {order && (
            <>
              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Order ID</Text>
                  <Text className="text-sm font-semibold text-gray-900">#{order.id}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Order total</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    ₹{order.amount.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Status</Text>
                  <Text className="text-sm font-semibold text-green-600 capitalize">
                    {order.paymentStatus === 'paid' || order.status === 'paid'
                      ? 'Paid'
                      : order.status || order.paymentStatus || 'Pending'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Confirmed on</Text>
                  <Text className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</Text>
                </View>
              </View>

              <View className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 mb-5">
                <Text className="text-sm font-semibold text-emerald-900 mb-1">
                  Expected delivery: {formatShortDate(deliveryEta(order.createdAt))}
                </Text>
                <Text className="text-xs text-gray-600 mb-3">Usually delivered within 7 days from order date</Text>
                {progressIndex(order) < 0 ? (
                  <Text className="text-xs font-semibold text-red-600">
                    Order is {order.status || order.paymentStatus}
                  </Text>
                ) : (
                  <View className="gap-2">
                    {ORDER_PROGRESS_STEPS.map((step, idx) => {
                      const done = idx <= progressIndex(order);
                      return (
                        <View key={step.key} className="flex-row items-center gap-2">
                          <View className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-emerald-700' : 'bg-gray-300'}`} />
                          <Text className={`text-xs ${done ? 'text-emerald-900 font-semibold' : 'text-gray-500'}`}>
                            {step.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          <View className="gap-3 mb-6">
            <TouchableOpacity
              className="w-full bg-emerald-700 py-3 rounded-xl active:opacity-90 flex-row items-center justify-center"
              onPress={() => router.push('/orders')}>
              <MaterialIcons name="receipt-long" size={20} color="#FFFFFF" />
              <Text className="text-base font-medium text-white ml-2">View My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full bg-white border border-gray-300 py-3 rounded-xl active:opacity-90 flex-row items-center justify-center"
              onPress={() => router.push('/(tabs)/shop')}>
              <MaterialIcons name="shopping-bag" size={20} color="#374151" />
              <Text className="text-base font-medium text-gray-800 ml-2">Continue Shopping</Text>
            </TouchableOpacity>
          </View>

          <View className="pt-4 border-t border-gray-200">
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="local-shipping" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                {order?.razorpayPaymentId || order?.razorpayOrderId
                  ? `Ref: ${(order.razorpayPaymentId || order.razorpayOrderId)?.slice(0, 28)}...`
                  : 'You will receive an order confirmation update shortly.'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}



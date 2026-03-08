import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from '../components/Loading';
import { apiFetch } from '../lib/api';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customerName?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: OrderItem[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700' },
  created: { bg: 'bg-amber-100', text: 'text-amber-700' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  failed: { bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusDisplay(status: string, paymentStatus: string) {
  if (paymentStatus === 'paid' || status === 'paid') return 'Paid';
  if (paymentStatus === 'failed' || status === 'failed') return 'Failed';
  if (paymentStatus === 'created') return 'Processing';
  return status || paymentStatus || 'Pending';
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await apiFetch('/orders?page=1&pageSize=20');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setOrders(list);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} className="flex-row items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/48' }}
        className="w-12 h-12 rounded-lg bg-gray-100"
        resizeMode="cover"
      />
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          Qty: {item.quantity} × ₹{item.price.toFixed(0)}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-gray-900">
        ₹{(item.price * item.quantity).toFixed(0)}
      </Text>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const statusKey = (item.paymentStatus || item.status || 'pending').toLowerCase();
    const statusStyle = STATUS_STYLES[statusKey] || { bg: 'bg-gray-100', text: 'text-gray-600' };
    const statusDisplay = getStatusDisplay(item.status, item.paymentStatus);

    return (
      <View className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100">
        {/* Header */}
        <View className="flex-row justify-between items-start p-4 pb-3">
          <View>
            <Text className="text-lg font-bold text-gray-900">Order #{item.id}</Text>
            <Text className="text-xs text-gray-500 mt-1">{formatDate(item.createdAt)}</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusDisplay}</Text>
          </View>
        </View>

        {/* Items */}
        <View className="px-4 pb-3">
          {item.items?.slice(0, 3).map(renderOrderItem)}
          {item.items && item.items.length > 3 && (
            <Text className="text-xs text-gray-500 py-2">
              +{item.items.length - 3} more item(s)
            </Text>
          )}
        </View>

        {/* Address (compact) */}
        {(item.addressLine || item.city) && (
          <View className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <View className="flex-row items-start gap-2">
              <MaterialIcons name="location-on" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 flex-1" numberOfLines={2}>
                {[item.addressLine, item.city, item.state, item.pincode].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row justify-between items-center px-4 py-4 bg-gray-50 border-t border-gray-100">
          <Text className="text-base font-semibold text-gray-700">Total</Text>
          <Text className="text-xl font-bold text-green-600">₹{item.amount.toFixed(0)}</Text>
        </View>

        {/* View details */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-3 border-t border-gray-100 active:bg-gray-50"
          onPress={() => router.push(`/order-success?orderId=${item.id}` as any)}
          activeOpacity={0.7}>
          <Text className="text-sm font-medium text-green-600">View details</Text>
          <MaterialIcons name="chevron-right" size={18} color="#059669" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <MaterialIcons name="receipt-long" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-medium text-gray-600 text-center mb-2">No orders yet</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Your order history will appear here once you make a purchase.
          </Text>
          <TouchableOpacity
            className="bg-green-600 px-6 py-3 rounded-xl active:bg-green-700"
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className="text-base font-semibold text-white">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

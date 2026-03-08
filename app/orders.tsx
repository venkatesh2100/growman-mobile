import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../lib/api';

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
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
      const response = await apiFetch('/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-md">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold text-gray-900">Order #{item.orderNumber}</Text>
        <Text className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-xl">
          {item.status}
        </Text>
      </View>
      <Text className="text-sm text-gray-500 mb-3">
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View className="mb-3">
        {item.items?.map((orderItem, index) => (
          <Text key={index} className="text-sm text-gray-700 mb-1">
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
      </View>
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
        <Text className="text-base font-semibold text-gray-900">Total:</Text>
        <Text className="text-xl font-bold text-green-600">₹{item.total}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-lg text-gray-500">No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}



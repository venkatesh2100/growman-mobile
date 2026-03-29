import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderListSkeleton } from '../components/skeletons/OrderListSkeleton';
import { apiFetch } from '../lib/api';
import { UI } from '../lib/ui';
import { useAuthStore } from '../store/authStore';

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

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const PAGE_SIZE = 15;

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

function statusChipStyle(key: string): { bg: string; text: string; border: string } {
  switch (key) {
    case 'paid':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'created':
    case 'pending':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'failed':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export default function OrdersScreen() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!token) return;
      const response = await apiFetch(`/orders?page=${pageNum}&pageSize=${PAGE_SIZE}`);
      if (response.status === 401) {
        setError('Session expired. Please sign in again.');
        setOrders([]);
        return;
      }
      if (!response.ok) {
        if (!append) setError('Could not load orders. Pull to retry.');
        return;
      }
      const data = await response.json();
      const list: Order[] = Array.isArray(data) ? data : data.data || [];
      const meta: PaginationMeta | undefined = data.pagination;

      if (append) {
        setOrders((prev) => [...prev, ...list]);
      } else {
        setOrders(list);
      }
      setPage(pageNum);
      if (meta) {
        setHasNext(meta.hasNext);
        setTotal(meta.total);
      } else {
        setHasNext(list.length >= PAGE_SIZE);
      }
      setError(null);
    },
    [token]
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchOrders(1, false);
      } catch {
        if (!cancelled) setError('Network error. Check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, fetchOrders]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await fetchOrders(1, false);
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setRefreshing(false);
    }
  }, [token, fetchOrders]);

  const loadMore = useCallback(async () => {
    if (!token || !hasNext || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      await fetchOrders(page + 1, true);
    } catch {
      /* keep list */
    } finally {
      setLoadingMore(false);
    }
  }, [token, hasNext, loadingMore, loading, refreshing, page, fetchOrders]);

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} className="flex-row items-center gap-3 py-2.5 border-b border-emerald-50 last:border-b-0">
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/48' }}
        className="w-11 h-11 rounded-xl bg-gray-100"
        resizeMode="cover"
      />
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-medium text-emerald-950" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {item.quantity} × ₹{item.price.toFixed(0)}
        </Text>
      </View>
      <Text className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</Text>
    </View>
  );

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const statusKey = (item.paymentStatus || item.status || 'pending').toLowerCase();
    const chip = statusChipStyle(statusKey);
    const statusDisplay = getStatusDisplay(item.status, item.paymentStatus);
    const itemCount = item.items?.length ?? 0;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 45, 400)).duration(320)}>
        <View
          className="bg-white rounded-2xl mb-4 overflow-hidden border border-emerald-100/80"
          style={{
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
          <View className="flex-row">
            <View className="w-1 self-stretch" style={{ backgroundColor: UI.color.primary }} />
            <View className="flex-1 p-4 pl-3">
              <View className="flex-row justify-between items-start gap-2">
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-bold text-emerald-950">Order #{item.id}</Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <MaterialIcons name="schedule" size={14} color={UI.color.muted} />
                    <Text className="text-xs text-gray-500">{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <View className={`px-3 py-1 rounded-full border ${chip.bg} ${chip.border}`}>
                  <Text className={`text-xs font-bold ${chip.text}`}>{statusDisplay}</Text>
                </View>
              </View>

              {itemCount > 0 && (
                <View className="mt-3 pt-3 border-t border-emerald-50">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Text>
                  {item.items.slice(0, 4).map(renderOrderItem)}
                  {itemCount > 4 && (
                    <Text className="text-xs text-emerald-700 font-medium py-1">
                      +{itemCount - 4} more in this order
                    </Text>
                  )}
                </View>
              )}

              {(item.addressLine || item.city) && (
                <View className="mt-3 flex-row items-start gap-2 p-3 rounded-xl bg-emerald-50/80">
                  <MaterialIcons name="location-on" size={18} color={UI.color.primary} />
                  <Text className="text-xs text-gray-700 flex-1 leading-5" numberOfLines={3}>
                    {[item.addressLine, item.city, item.state, item.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-emerald-50">
                <Text className="text-sm font-semibold text-gray-600">Total</Text>
                <Text className="text-xl font-bold" style={{ color: UI.color.primaryDark }}>
                  ₹{item.amount.toFixed(0)}
                </Text>
              </View>

              {(item.razorpayPaymentId || item.razorpayOrderId) && (
                <Text className="text-[10px] text-gray-400 mt-2" numberOfLines={1}>
                  Ref: {item.razorpayPaymentId || item.razorpayOrderId}
                </Text>
              )}

              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 mt-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 active:opacity-90"
                onPress={() =>
                  router.push({ pathname: '/order-success', params: { orderId: String(item.id) } })
                }>
                <Text className="text-sm font-semibold" style={{ color: UI.color.primaryDark }}>
                  View order details
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={UI.color.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const listHeader = () => (
    <View className="mb-4">
      {total > 0 && (
        <Text className="text-sm text-gray-600">
          {total} {total === 1 ? 'order' : 'orders'} total
          {hasNext ? ' · more below' : ''}
        </Text>
      )}
    </View>
  );

  const listFooter = () => (
    <View className="py-4 items-center">
      {loadingMore ? (
        <Text className="text-xs text-gray-500">Loading more…</Text>
      ) : hasNext && orders.length > 0 ? (
        <Text className="text-xs text-gray-400">Scroll for more</Text>
      ) : orders.length > 0 ? (
        <Text className="text-xs text-gray-400">You&apos;re all caught up</Text>
      ) : null}
    </View>
  );

  const headerBar = (
    <View className="flex-row items-center px-4 py-3 border-b border-emerald-100 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-xl active:bg-emerald-50">
        <MaterialIcons name="arrow-back" size={UI.icon.lg} color={UI.color.ink} />
      </TouchableOpacity>
      <View className="flex-1 ml-1">
        <Text className="text-lg font-bold text-emerald-950">My orders</Text>
        {!loading && orders.length > 0 && (
          <Text className="text-xs text-gray-500">{orders.length} shown</Text>
        )}
      </View>
    </View>
  );

  if (!token) {
    return (
      <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: UI.color.canvas }}>
        {headerBar}
        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}>
            <MaterialIcons name="lock-outline" size={40} color={UI.color.primary} />
          </View>
          <Text className="text-lg font-semibold text-emerald-950 text-center mb-2">Sign in to see orders</Text>
          <Text className="text-sm text-gray-600 text-center mb-6">
            Your order history is available after you sign in.
          </Text>
          <TouchableOpacity
            className="px-8 py-3.5 rounded-2xl active:opacity-90"
            style={{ backgroundColor: UI.color.primary }}
            onPress={() => router.push('/(auth)/login')}>
            <Text className="text-base font-semibold text-white">Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: UI.color.canvas }}>
        {headerBar}
        <OrderListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: UI.color.canvas }}>
      {headerBar}

      {error && orders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <MaterialIcons name="error-outline" size={48} color={UI.color.muted} />
          <Text className="text-base text-gray-700 text-center mt-4 mb-6">{error}</Text>
          <TouchableOpacity
            className="px-6 py-3 rounded-2xl border border-emerald-200 bg-white active:opacity-90"
            onPress={() => {
              setLoading(true);
              fetchOrders(1, false)
                .catch(() => {})
                .finally(() => setLoading(false));
            }}>
            <Text className="font-semibold" style={{ color: UI.color.primaryDark }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
            <MaterialIcons name="receipt-long" size={40} color={UI.color.primary} />
          </View>
          <Text className="text-lg font-semibold text-emerald-950 text-center mb-2">No orders yet</Text>
          <Text className="text-sm text-gray-600 text-center mb-8">
            When you buy plants, your orders and delivery details will show up here.
          </Text>
          <TouchableOpacity
            className="flex-row items-center px-8 py-3.5 rounded-2xl gap-2 active:opacity-90"
            style={{ backgroundColor: UI.color.primary }}
            onPress={() => router.push('/(tabs)/shop')}>
            <MaterialIcons name="eco" size={22} color="#fff" />
            <Text className="text-base font-semibold text-white">Browse shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[UI.color.primary]}
              tintColor={UI.color.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
        />
      )}
    </SafeAreaView>
  );
}

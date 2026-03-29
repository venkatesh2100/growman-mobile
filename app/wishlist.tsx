import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductGridSkeleton } from '../components/skeletons/ProductGridSkeleton';
import { UI } from '../lib/ui';
import ProductCard from '../components/ProductCard';
import { toast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { Product } from '../lib/types';
import { useAuthStore } from '../store/authStore';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/wishlist');
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast('Failed to load wishlist', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        setLoading(true);
        loadWishlist();
      } else {
        setLoading(false);
        setProducts([]);
      }
    }, [token, loadWishlist])
  );

  const handleRemove = async (productId: number) => {
    if (!token) return;
    setRemovingId(productId);
    try {
      const res = await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast('Removed from wishlist', 'success');
      } else {
        toast('Failed to remove', 'error');
      }
    } catch (error) {
      toast('Failed to remove', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  if (!token) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
            <MaterialIcons name="favorite" size={40} color="#3B82F6" />
          </View>
          <Text className="text-lg font-medium text-gray-600 text-center mb-2">Login to view wishlist</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Sign in to save your favorite plants and access them anytime.
          </Text>
          <TouchableOpacity
            className="px-6 py-3 rounded-2xl bg-emerald-700"
            onPress={() => router.replace('/(auth)')}>
            <Text className="text-base font-semibold text-white">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: UI.color.canvas, paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-emerald-100 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <MaterialIcons name="arrow-back" size={UI.icon.lg} color={UI.color.ink} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-emerald-950">Wishlist</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 px-2 pt-3">
          <ProductGridSkeleton count={6} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvas, paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-emerald-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <MaterialIcons name="arrow-back" size={UI.icon.lg} color={UI.color.ink} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-emerald-950">Wishlist</Text>
        <View className="w-10" />
      </View>

      {products.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}>
            <MaterialIcons name="favorite-border" size={40} color={UI.color.primary} />
          </View>
          <Text className="text-lg font-medium text-gray-600 text-center mb-2">Your wishlist is empty</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Save plants you love by tapping the heart icon on product pages.
          </Text>
          <TouchableOpacity
            className="px-6 py-3 rounded-2xl bg-emerald-700"
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className="text-base font-semibold text-white">Browse plants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16, marginBottom: 12 }}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
          renderItem={({ item, index }) => (
            <View className="flex-1 max-w-[48%]" style={{ marginHorizontal: 0 }}>
              <View className="relative">
                <ProductCard
                  product={item}
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.slug } })}
                  index={index}
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/95 items-center justify-center"
                  style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                  onPress={() => handleRemove(item.id)}
                  disabled={removingId === item.id}>
                  <MaterialIcons
                    name="favorite"
                    size={22}
                    color={removingId === item.id ? '#9CA3AF' : '#EF4444'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

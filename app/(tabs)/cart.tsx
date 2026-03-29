import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/cartStore';
import { showAlert } from '../../components/Alert';
import { useSearchStore } from '../../store/searchStore';
import { UI } from '../../lib/ui';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSearch = useSearchStore((s) => s.openSearch);
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      showAlert('Cart empty', 'Add plants to your cart first.');
      return;
    }
    router.push('/checkout');
  };

  const subtotal = getSubtotal();
  const discount = 0;
  const shipping: number = 0;
  const total = subtotal - discount + shipping;

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvas }}>
      <View
        className="flex-row items-center justify-between px-4 border-b border-emerald-100 bg-white"
        style={{ paddingTop: insets.top + 10, paddingBottom: 14 }}>
        <Text className="text-xl font-bold text-emerald-950">Cart</Text>
        <TouchableOpacity
          onPress={() => openSearch()}
          className="w-11 h-11 rounded-2xl items-center justify-center active:bg-emerald-50"
          accessibilityLabel="Search">
          <MaterialIcons name="search" size={UI.icon.lg} color={UI.color.primary} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
            <MaterialIcons name="shopping-bag" size={40} color={UI.color.primary} />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">Your cart is empty</Text>
          <Text className="text-base text-gray-600 mb-8 text-center leading-6">
            Discover plants tailored to your space — start browsing the shop.
          </Text>
          <TouchableOpacity
            className="flex-row items-center px-8 py-3.5 rounded-2xl bg-emerald-700 active:opacity-90"
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className="text-base font-semibold text-white mr-2">Start shopping</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
            {items.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-2xl p-3 mb-3 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                <View className="flex-row items-start gap-3">
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                    className="w-20 h-20 rounded-xl bg-gray-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1 min-w-0">
                    <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.label ? (
                      <Text className="text-xs text-gray-500 mb-2">Size: {item.label}</Text>
                    ) : null}
                    <View className="flex-row items-center gap-2 mb-2">
                      <Text className="text-base font-bold" style={{ color: UI.color.primary }}>
                        ₹{item.price.toFixed(0)}
                      </Text>
                      {item.mrp && item.mrp > item.price && (
                        <Text className="text-xs text-gray-400 line-through">₹{item.mrp.toFixed(0)}</Text>
                      )}
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1 bg-gray-100 rounded-xl p-1">
                        <TouchableOpacity
                          className="w-8 h-8 items-center justify-center rounded-lg active:bg-gray-200"
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}>
                          <MaterialIcons
                            name="remove"
                            size={18}
                            color={item.quantity <= 1 ? '#9CA3AF' : '#374151'}
                          />
                        </TouchableOpacity>
                        <Text className="text-sm font-semibold text-gray-900 w-7 text-center">{item.quantity}</Text>
                        <TouchableOpacity
                          className="w-8 h-8 items-center justify-center rounded-lg active:bg-gray-200"
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                          <MaterialIcons name="add" size={18} color="#374151" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        className="p-2 rounded-xl active:bg-red-50"
                        onPress={() => removeItem(item.id)}
                        accessibilityLabel="Remove item">
                        <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-sm font-bold text-emerald-800">₹{(item.price * item.quantity).toFixed(0)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className="bg-white px-4 pt-4 border-t border-emerald-100" style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className="text-base font-bold text-emerald-950 mb-3">Order summary</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Items</Text>
              <Text className="text-sm text-gray-900">₹{Number(subtotal).toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-emerald-600">Discount</Text>
                <Text className="text-sm text-emerald-600">−₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Delivery</Text>
              <Text className="text-sm text-emerald-600 font-medium">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</Text>
            </View>
            {subtotal < 500 && (
              <Text className="text-xs text-emerald-700 mb-3">
                Add ₹{(500 - subtotal).toFixed(2)} more for free shipping (when applicable).
              </Text>
            )}
            <View className="border-t border-gray-200 pt-3 mt-1 flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold text-emerald-900">₹{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              className="w-full py-3.5 rounded-2xl bg-emerald-700 flex-row items-center justify-center active:opacity-90"
              onPress={handleCheckout}>
              <Text className="text-base font-semibold text-white mr-2">Checkout</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-[10px] text-gray-500 text-center mt-3">Secure payment · Razorpay</Text>
          </View>
        </>
      )}
    </View>
  );
}

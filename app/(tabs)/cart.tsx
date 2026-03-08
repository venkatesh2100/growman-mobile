import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart');
      return;
    }
    router.push('/checkout');
  };

  const subtotal = getSubtotal();
  const discount: number = 0; // Can be calculated from MRP vs price
  const shipping: number = subtotal > 500 ? 0 : 0;
  const total: number = subtotal - discount + shipping;

  const renderCartItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl p-3 mb-3 shadow-md">
      <View className="flex-row items-start gap-3">
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/100' }}
          className="w-20 h-20 rounded-lg bg-gray-100"
          resizeMode="cover"
        />
        <View className="flex-1 min-w-0">
          <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {item.name}
          </Text>
          {item.label && (
            <Text className="text-sm text-gray-500 mb-1">Size: {item.label}</Text>
          )}
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-base font-semibold text-gray-900">₹{item.price.toFixed(0)}</Text>
            {item.mrp && item.mrp > item.price && (
              <Text className="text-xs text-gray-400 line-through">₹{item.mrp.toFixed(0)}</Text>
            )}
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                className="w-6 h-6 items-center justify-center rounded active:bg-gray-200"
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}>
                <MaterialIcons name="remove" size={16} color={item.quantity <= 1 ? "#9CA3AF" : "#374151"} />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-gray-900 w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity
                className="w-6 h-6 items-center justify-center rounded active:bg-gray-200"
                onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <MaterialIcons name="add" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="text-red-500 active:text-red-700 p-1.5 active:bg-red-50 rounded"
              onPress={() => removeItem(item.id)}>
              <MaterialIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <Text className="text-sm font-semibold text-gray-900 mt-2">
            ₹{(item.price * item.quantity).toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {items.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="shopping-bag" size={64} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">Your cart is empty</Text>
          <Text className="text-base text-gray-600 mb-6 text-center">
            Looks like you haven&apos;t added any plants to your cart yet.
          </Text>
          <TouchableOpacity
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium active:bg-green-700 flex-row items-center"
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className="text-base font-medium text-white mr-2">Start Shopping</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {items.map((item) => (
              <View key={item.id}>
                {renderCartItem({ item })}
              </View>
            ))}
          </ScrollView>

          {/* Order Summary Footer */}
          <View className="bg-white p-4 border-t border-gray-200">
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Order Summary</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between text-sm text-gray-700 mb-1">
                  <Text className="text-sm text-gray-700">Items Price</Text>
                  <Text className="text-sm text-gray-700">₹{Number(subtotal).toFixed(2)}</Text>
                </View>
                {discount > 0 && (
                  <View className="flex-row justify-between text-sm text-green-600 font-medium mb-1">
                    <Text className="text-sm text-green-600 font-medium">Discount</Text>
                    <Text className="text-sm text-green-600 font-medium">-₹{discount.toFixed(2)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between text-sm text-gray-700 mb-1">
                  <Text className="text-sm text-gray-700">Delivery</Text>
                  <Text className={`text-sm ${shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </Text>
                </View>
                {subtotal < 500 && (
                  <Text className="text-xs text-green-600 font-medium mt-1">
                    Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
                  </Text>
                )}
                <View className="border-t border-gray-300 pt-2 mt-2">
                  <View className="flex-row justify-between text-lg font-bold text-gray-900">
                    <Text className="text-lg font-bold text-gray-900">Total</Text>
                    <Text className="text-lg font-bold text-gray-900">₹{total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-full bg-green-600 py-3 rounded-lg font-semibold active:bg-green-700 flex-row items-center justify-center"
              onPress={handleCheckout}>
              <Text className="text-base font-semibold text-white mr-2">Proceed to Checkout</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-[10px] text-gray-500 text-center mt-3">
              Secure checkout with Razorpay
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

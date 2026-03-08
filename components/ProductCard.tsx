import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons } from '@expo/vector-icons';
import { Product } from '../lib/types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  index?: number;
}

export default function ProductCard({ product, onPress, index = 0 }: ProductCardProps) {
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        className="bg-white rounded-2xl overflow-hidden mb-4 shadow-md"
        onPress={onPress}
        activeOpacity={0.8}>
        <View className="relative w-full h-[200px] bg-gray-100">
          <Image
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/200' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {discount > 0 && (
            <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-lg">
              <Text className="text-white text-xs font-bold">{discount}% OFF</Text>
            </View>
          )}
          {product.stock === 0 && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center">
              <Text className="text-white text-base font-bold">Out of Stock</Text>
            </View>
          )}
        </View>
        <View className="p-3">
          <Text className="text-[15px] font-semibold text-gray-900 mb-2 min-h-[42px] leading-[21px]" numberOfLines={2}>
            {product.name}
          </Text>
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-lg font-bold text-green-600">₹{product.price}</Text>
            {product.mrp && product.mrp > product.price && (
              <Text className="text-sm text-gray-400 line-through">₹{product.mrp}</Text>
            )}
          </View>
          {product.stock !== undefined && product.stock > 0 && (
            <View className="flex-row items-center gap-1 mt-1">
              <MaterialIcons name="check-circle" size={14} color="#10B981" />
              <Text className="text-xs text-green-500 font-medium">In Stock</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

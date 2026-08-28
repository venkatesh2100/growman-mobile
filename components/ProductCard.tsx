import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Product } from '../lib/types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  index?: number;
  variant?: 'default' | 'compact';
}

export default function ProductCard({ product, onPress, index = 0, variant = 'default' }: ProductCardProps) {
  const compact = variant === 'compact';
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 200)).duration(280)}>
      <TouchableOpacity
        className={`bg-white overflow-hidden shadow-sm ${compact ? 'rounded-xl mb-2' : 'rounded-2xl mb-4 shadow-md'}`}
        onPress={onPress}
        activeOpacity={0.8}>
        <View className={`relative w-full bg-gray-100 ${compact ? 'h-[160px]' : 'h-[160px]'}`}>
          <Image
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/200' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {discount > 0 && (
            <View className={`absolute top-1.5 right-1.5 bg-red-500 rounded-md ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1 rounded-lg'}`}>
              <Text className={`text-white font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>{discount}% OFF</Text>
            </View>
          )}
          {product.stock === 0 && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center">
              <Text className={`text-white font-bold ${compact ? 'text-xs' : 'text-base'}`}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View className={compact ? 'p-2' : 'p-3'}>
          <Text
            className={`font-semibold text-gray-900 mb-1 ${
              compact ? 'text-[13px] min-h-[32px] leading-4' : 'text-[15px] mb-2 min-h-[42px] leading-[21px]'
            }`}
            numberOfLines={2}>
            {product.name}
          </Text>
          <View className="flex-row items-center flex-wrap gap-x-1.5 gap-y-0.5">
            <Text className={`font-bold text-emerald-600 ${compact ? 'text-sm' : 'text-lg'}`}>₹{product.price}</Text>
            {product.mrp && product.mrp > product.price && (
              <Text className={`text-gray-400 line-through ${compact ? 'text-[11px]' : 'text-sm'}`}>₹{product.mrp}</Text>
            )}
          </View>
          {!compact && product.stock !== undefined && product.stock > 0 && (
            <View className="flex-row items-center gap-1 mt-1">
              <MaterialIcons name="check-circle" size={14} color="#10B981" />
              <Text className="text-xs text-emerald-500 font-medium">In Stock</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

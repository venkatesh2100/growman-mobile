import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ProductSize } from '../../lib/types';

interface SizeSelectorProps {
  sizes: ProductSize[];
  selectedSize: ProductSize;
  productSlug: string;
  onSizeSelect?: (size: ProductSize) => void;
}

export default function SizeSelector({
  sizes,
  selectedSize,
  productSlug,
  onSizeSelect,
}: SizeSelectorProps) {
  const handleSizeSelect = (size: ProductSize) => {
    if (onSizeSelect) {
      onSizeSelect(size);
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
      <View className="flex-row gap-3">
        {sizes.map((size) => (
          <TouchableOpacity
            key={size.id}
            onPress={() => handleSizeSelect(size)}
            className={`border rounded-lg p-3 min-w-[120px] ${
              selectedSize.id === size.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white'
            }`}>
            <Text className="text-sm font-medium">{size.label}</Text>
            {size.dimension && (
              <Text className="text-gray-600 text-xs mt-1">{size.dimension}</Text>
            )}
            <Text className="font-bold text-emerald-700 mt-1">
              ₹{size.price.toFixed(2)}
            </Text>
            <Text
              className={`text-xs mt-1 ${
                size.stock > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
              {size.stock > 0 ? `${size.stock} available` : 'Out of stock'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}


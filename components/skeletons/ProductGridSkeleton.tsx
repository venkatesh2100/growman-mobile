import React from 'react';
import { View } from 'react-native';
import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductGridSkeleton({ count = 6, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <View className="flex-row flex-wrap justify-between px-2">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="w-[49%]">
          <ProductCardSkeleton compact={compact} />
        </View>
      ))}
    </View>
  );
}

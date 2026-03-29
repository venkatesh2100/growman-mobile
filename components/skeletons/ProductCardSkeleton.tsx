import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

/** Matches ProductCard layout: image block + text lines */
export function ProductCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-100">
      <Skeleton height={200} width="100%" rounded="lg" style={{ borderRadius: 0 }} />
      <View className="p-3 gap-2">
        <Skeleton height={14} width="90%" rounded="sm" />
        <Skeleton height={14} width="60%" rounded="sm" />
        <Skeleton height={18} width={72} rounded="sm" />
      </View>
    </View>
  );
}

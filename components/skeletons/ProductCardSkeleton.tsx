import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

/** Matches ProductCard layout: image block + text lines */
export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <View className={`bg-white overflow-hidden border border-gray-100 ${compact ? 'rounded-xl mb-2' : 'rounded-2xl mb-4'}`}>
      <Skeleton height={compact ? 160 : 200} width="100%" rounded="lg" style={{ borderRadius: 0 }} />
      <View className={compact ? 'p-2 gap-1.5' : 'p-3 gap-2'}>
        <Skeleton height={compact ? 12 : 14} width="90%" rounded="sm" />
        <Skeleton height={compact ? 12 : 14} width="60%" rounded="sm" />
        <Skeleton height={compact ? 14 : 18} width={compact ? 56 : 72} rounded="sm" />
      </View>
    </View>
  );
}

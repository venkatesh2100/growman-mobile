import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './Skeleton';

export function ProductDetailSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4">
        <Skeleton height={220} width="100%" rounded="lg" />
        <View className="bg-white rounded-2xl p-4 mt-4 gap-3">
          <Skeleton height={28} width="85%" rounded="sm" />
          <Skeleton height={16} width="40%" rounded="sm" />
          <Skeleton height={40} width="100%" rounded="md" />
          <Skeleton height={48} width="100%" rounded="xl" />
        </View>
      </View>
    </View>
  );
}

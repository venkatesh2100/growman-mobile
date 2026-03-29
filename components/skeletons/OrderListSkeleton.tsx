import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './Skeleton';

export function OrderListSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 px-4 pt-2" style={{ paddingTop: insets.top + 8 }}>
      {[0, 1, 2].map((k) => (
        <View
          key={k}
          className="bg-white rounded-2xl p-4 mb-4 border border-emerald-100/60"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <Skeleton height={18} width={120} rounded="md" />
              <View className="h-2" />
              <Skeleton height={14} width={180} rounded="sm" />
            </View>
            <Skeleton height={28} width={72} rounded="full" />
          </View>
          <View className="flex-row gap-2 mb-3">
            <Skeleton height={48} width={48} rounded="lg" />
            <Skeleton height={48} width={48} rounded="lg" />
            <Skeleton height={48} width={48} rounded="lg" />
          </View>
          <Skeleton height={14} width="100%" rounded="sm" />
          <View className="h-3" />
          <Skeleton height={40} width="100%" rounded="lg" />
        </View>
      ))}
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

export function AccountSkeleton() {
  return (
    <View className="flex-1 bg-gray-50 px-4 pt-8">
      <View className="items-center mb-8">
        <Skeleton height={96} width={96} rounded="full" />
        <View className="h-4" />
        <Skeleton height={20} width={160} rounded="sm" />
        <View className="h-2" />
        <Skeleton height={14} width={220} rounded="sm" />
      </View>
      <Skeleton height={120} width="100%" rounded="lg" />
      <View className="h-4" />
      <Skeleton height={200} width="100%" rounded="lg" />
    </View>
  );
}

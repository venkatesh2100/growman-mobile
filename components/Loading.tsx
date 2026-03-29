import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { UI } from '../lib/ui';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

/** Lightweight loader — prefer skeletons for product lists. */
export default function Loading({ fullScreen = true, message }: LoadingProps) {
  const inner = (
    <View className="items-center justify-center gap-3 py-8">
      <ActivityIndicator size="large" color={UI.color.primary} />
      {message ? <Text className="text-sm text-gray-500">{message}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 min-h-[200px] items-center justify-center bg-gray-50 px-4">{inner}</View>;
  }
  return inner;
}

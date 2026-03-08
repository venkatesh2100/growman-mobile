'use client';

import LottieView from 'lottie-react-native';
import { View } from 'react-native';

interface LoadingProps {
  /** Full screen layout (default: true for standalone loading screens) */
  fullScreen?: boolean;
}

export default function Loading({ fullScreen = true }: LoadingProps) {
  const content = (
    <View className="w-64 h-64">
      <LottieView
        source={require('../assets/Girl.json')}
        autoPlay
        loop
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 min-h-screen items-center justify-center px-4 bg-gray-50">
        {content}
      </View>
    );
  }

  return <View className="items-center justify-center py-10">{content}</View>;
}

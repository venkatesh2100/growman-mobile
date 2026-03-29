import React, { useEffect } from 'react';
import { DimensionValue, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  className?: string;
  style?: ViewStyle;
  height?: DimensionValue;
  width?: DimensionValue;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

export function Skeleton({ className = '', style, height, width, rounded = 'md' }: Props) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 700 }), withTiming(0.45, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const r =
    rounded === 'full'
      ? 9999
      : rounded === 'xl'
        ? 20
        : rounded === 'lg'
          ? 16
          : rounded === 'md'
            ? 12
            : 8;

  return (
    <Animated.View
      style={[
        {
          height: height ?? 16,
          width: width ?? '100%',
          borderRadius: r,
          backgroundColor: '#D1D5DB',
        },
        animatedStyle,
        style,
      ]}
      className={className}
    />
  );
}

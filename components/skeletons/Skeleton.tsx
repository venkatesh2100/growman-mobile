import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { DimensionValue, LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type Props = {
  className?: string;
  style?: ViewStyle;
  height?: DimensionValue;
  width?: DimensionValue;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const BASE_TONE = '#E7ECE8';

/** A soft light-sweep shimmer — reads as "content is loading", not "something broke". */
export function Skeleton({ className = '', style, height, width, rounded = 'md' }: Props) {
  const [boxWidth, setBoxWidth] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [sweep]);

  const animatedStyle = useAnimatedStyle(() => {
    const span = Math.max(boxWidth, 40) * 1.6;
    return {
      transform: [{ translateX: -span / 2 + sweep.value * span }],
    };
  });

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

  const onLayout = (e: LayoutChangeEvent) => setBoxWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          height: height ?? 16,
          width: width ?? '100%',
          borderRadius: r,
          backgroundColor: BASE_TONE,
          overflow: 'hidden',
        },
        style,
      ]}
      className={className}>
      {boxWidth > 0 && (
        <Animated.View
          style={[
            { position: 'absolute', top: 0, bottom: 0, width: boxWidth * 0.55 },
            animatedStyle,
          ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

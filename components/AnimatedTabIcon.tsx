import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { UI } from '../lib/ui';

type IconName = keyof typeof MaterialIcons.glyphMap;

type AnimatedTabIconProps = {
  focused: boolean;
  color: string;
  size: number;
  /** Icon when tab is inactive */
  icon: IconName;
  /** Optional bolder/filled icon when active */
  iconFocused?: IconName;
  /** Elevated gradient pill — used for Dootha */
  variant?: 'default' | 'center';
};

const springIn = { damping: 14, stiffness: 260, mass: 0.65 };
const springOut = { damping: 16, stiffness: 200, mass: 0.7 };

export function AnimatedTabIcon({
  focused,
  color,
  size,
  icon,
  iconFocused,
  variant = 'default',
}: AnimatedTabIconProps) {
  const scale = useSharedValue(focused ? 1.06 : 0.94);
  const pill = useSharedValue(focused ? 1 : 0);
  const dot = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 0.94, focused ? springIn : springOut);
    pill.value = withSpring(focused ? 1 : 0, springIn);
    dot.value = withSpring(focused ? 1 : 0, springIn);
  }, [focused, scale, pill, dot]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillAnim = useAnimatedStyle(() => ({
    opacity: pill.value * 0.95,
    transform: [{ scale: 0.88 + pill.value * 0.12 }],
  }));

  // const dotAnim = useAnimatedStyle(() => ({
  //   opacity: dot.value,
  //   transform: [{ scale: 0.5 + dot.value * 0.5 }],
  // }));

  const iconName = focused && iconFocused ? iconFocused : icon;
  const iconSize = focused ? size + 1 : size - 1;

  if (variant === 'center') {
    return (
      <View className="items-center justify-center" style={{ marginTop: -10 }}>
        <LinearGradient
          colors={[UI.color.primary, UI.color.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: UI.color.primaryDark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 8,
            elevation: 6,
          }}>
          <MaterialIcons name="auto-awesome" size={26} color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ width: 44, height: 34, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          pillAnim,
          {
            position: 'absolute',
            width: 40,
            height: 30,
            borderRadius: 12,
            backgroundColor: '#ECFDF5',
          },
        ]}
      />
      <Animated.View style={iconAnim}>
        <MaterialIcons name={iconName} size={iconSize} color={color} />
      </Animated.View>
      {/* <Animated.View
        style={[
          dotAnim,
          {
            position: 'absolute',
            bottom: 0,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: UI.color.primary,
          },
        ]}
      /> */}
    </View>
  );
}

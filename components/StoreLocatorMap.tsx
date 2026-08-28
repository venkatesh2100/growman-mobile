import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { toast } from './Toast';
import { UI } from '../lib/ui';

const HYDERABAD_STORE_URL = 'https://maps.app.goo.gl/DUgWr7F8qkq79rDA7';

/**
 * Positions are hand-placed from each city's real lat/long, remapped into this
 * cluster's own bounding box (not India's) so the five points use the full card —
 * relative arrangement is geographically faithful, the card itself is illustrative.
 */
type StoreCity = { name: string; x: number; y: number; open: boolean };
const CITIES: StoreCity[] = [
  { name: 'Pune', x: 0.18, y: 0.18, open: false },
  { name: 'Hyderabad', x: 0.625, y: 0.313, open: true },
  { name: 'Amaravati', x: 0.82, y: 0.413, open: false },
  { name: 'Bengaluru', x: 0.539, y: 0.82, open: false },
  { name: 'Chennai', x: 0.795, y: 0.807, open: false },
];

const HUB = CITIES.find((c) => c.open)!;

function openHyderabadStore() {
  Linking.openURL(HYDERABAD_STORE_URL).catch(() => {
    toast('Could not open Maps. Try again.', 'error');
  });
}

function PulsingRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2.2, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: UI.color.primary },
        style,
      ]}
    />
  );
}

export default function StoreLocatorMap() {
  const { width: windowWidth } = useWindowDimensions();
  const [cardSize, setCardSize] = React.useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCardSize({ width, height });
  }, []);

  const cardHeight = Math.max(180, Math.round(windowWidth * 0.5));

  return (
    <View className="mt-7 px-4">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-xl" style={{ color: UI.color.ink, fontFamily: UI.font.display }}>
            Visit us in person
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: UI.color.muted }}>
            Our store, and where we&apos;re headed next
          </Text>
        </View>
      </View>

      <View
        className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: UI.color.primaryLight, borderWidth: 1, borderColor: '#DCEFE4' }}>
        <View
          onLayout={onLayout}
          style={{ height: cardHeight, position: 'relative' }}>
          {/* Faint dot-grid texture — reads as "map" without claiming coastline accuracy */}
          <View className="absolute inset-0 flex-row flex-wrap" pointerEvents="none">
            {Array.from({ length: 96 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: '12.5%',
                  height: '16.6%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(5,150,105,0.14)' }} />
              </View>
            ))}
          </View>

          {cardSize.width > 0 && (
            <Svg
              width={cardSize.width}
              height={cardSize.height}
              style={{ position: 'absolute', top: 0, left: 0 }}
              pointerEvents="none">
              {CITIES.filter((c) => !c.open).map((c) => (
                <Line
                  key={c.name}
                  x1={c.x * cardSize.width}
                  y1={c.y * cardSize.height}
                  x2={HUB.x * cardSize.width}
                  y2={HUB.y * cardSize.height}
                  stroke={UI.color.primary}
                  strokeOpacity={0.3}
                  strokeWidth={1.5}
                  strokeDasharray="1, 6"
                  strokeLinecap="round"
                />
              ))}
            </Svg>
          )}

          {CITIES.map((city) =>
            city.open ? (
              <TouchableOpacity
                key={city.name}
                onPress={openHyderabadStore}
                activeOpacity={0.85}
                style={{
                  position: 'absolute',
                  left: `${city.x * 100}%`,
                  top: `${city.y * 100}%`,
                  transform: [{ translateX: -18 }, { translateY: -18 }],
                  alignItems: 'center',
                }}>
                <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <PulsingRing />
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: UI.color.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}>
                    <MaterialIcons name="storefront" size={16} color="#FFFFFF" />
                  </View>
                </View>
                <View
                  className="mt-1 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: UI.color.ink }}>
                  <Text className="text-[10px] font-bold text-white">{city.name}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                key={city.name}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: `${city.x * 100}%`,
                  top: `${city.y * 100}%`,
                  transform: [{ translateX: -10 }, { translateY: -10 }],
                  alignItems: 'center',
                }}>
                <View
                  className="w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: UI.color.surface, borderWidth: 1.5, borderColor: UI.color.primary }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: UI.color.primary }} />
                </View>
                <Text
                  className="text-[10px] font-semibold mt-1"
                  style={{ color: UI.color.primaryDark }}>
                  {city.name}
                </Text>
              </View>
            )
          )}
        </View>

        <View className="px-4 pt-3 pb-4" style={{ backgroundColor: UI.color.surface }}>
          <View className="flex-row items-center gap-4 mb-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: UI.color.primary }} />
              <Text className="text-xs" style={{ color: UI.color.muted }}>
                Open now
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: UI.color.surface, borderWidth: 1.5, borderColor: UI.color.primary }}
              />
              <Text className="text-xs" style={{ color: UI.color.muted }}>
                Coming soon
              </Text>
            </View>
          </View>
{/* 
          <TouchableOpacity
            onPress={openHyderabadStore}
            activeOpacity={0.9}
            className="flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: UI.color.primaryLight }}>
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: UI.color.primary }}>
              <MaterialIcons name="storefront" size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: UI.color.ink }}>
                Growman Store, Hyderabad
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: UI.color.muted }}>
                Browse plants and pots in person — get directions
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={UI.color.primary} />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
}

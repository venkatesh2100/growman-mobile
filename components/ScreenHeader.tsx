import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '../lib/ui';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Defaults to router.back(). */
  onBack?: () => void;
  /** Hide the back button entirely (e.g. a tab root). */
  showBack?: boolean;
  right?: ReactNode;
}

/**
 * Standard stack-screen header: safe-area aware, emerald-branded, back button + title.
 * Use on every non-tab screen so headers read as one consistent app, not per-screen one-offs.
 */
export default function ScreenHeader({ title, subtitle, onBack, showBack = true, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: UI.color.surface,
        borderBottomWidth: 1,
        borderBottomColor: UI.color.border,
      }}>
      <View className="flex-row items-center px-3 py-3">
        {showBack ? (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            className="w-10 h-10 rounded-xl items-center justify-center active:bg-emerald-50"
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={UI.icon.lg} color={UI.color.ink} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <View className="flex-1 ml-1">
          <Text
            className="text-lg"
            style={{ color: UI.color.ink, fontFamily: UI.font.display }}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-xs mt-0.5" style={{ color: UI.color.muted }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View className="ml-2">{right}</View> : <View className="w-10" />}
      </View>
    </View>
  );
}

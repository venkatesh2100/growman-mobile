import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  label: string | null;
  loading?: boolean;
  onPress: () => void;
  ink?: string;
};

export default function DeliveryLocationRow({ label, loading, onPress, ink = '#064e3b' }: Props) {
  return (
    <TouchableOpacity
      className="flex-row items-center mt-0.5 max-w-[210px]"
      activeOpacity={0.75}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={label ? `Delivery location: ${label}. Tap to change.` : 'Set delivery location'}>
      <MaterialIcons name="location-on" size={13} color={ink} style={{ opacity: 0.75 }} />
      {loading ? (
        <ActivityIndicator size="small" color={ink} style={{ marginLeft: 4 }} />
      ) : (
        <Text className="text-[12px] ml-0.5 flex-shrink" style={{ color: ink, opacity: 0.85 }} numberOfLines={1}>
          {label ?? 'Set delivery location'}
        </Text>
      )}
      <MaterialIcons name="edit" size={12} color={ink} style={{ marginLeft: 4, opacity: 0.65 }} />
    </TouchableOpacity>
  );
}

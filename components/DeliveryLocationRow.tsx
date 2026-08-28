import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type Props = {
  label: string | null;
  loading?: boolean;
  ink?: string;
};

export default function DeliveryLocationRow({ label, loading, ink = '#064e3b' }: Props) {
  if (!label && !loading) return null;

  return (
    <View className="flex-row items-center mt-0.5 max-w-[210px]">
      <MaterialIcons name="location-on" size={13} color={ink} style={{ opacity: 0.75 }} />
      {loading ? (
        <ActivityIndicator size="small" color={ink} style={{ marginLeft: 4 }} />
      ) : (
        <Text className="text-[12px] ml-0.5 flex-shrink" style={{ color: ink, opacity: 0.85 }} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
}

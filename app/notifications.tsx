import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { toast } from '../components/Toast';
import { UI } from '../lib/ui';

function NotificationRow({
  title,
  sub,
  value,
  onValueChange,
  last,
}: {
  title: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row justify-between items-center p-4"
      style={!last ? { borderBottomWidth: 1, borderBottomColor: UI.color.border } : undefined}>
      <View className="flex-1 pr-3">
        <Text className="text-[15px] font-medium text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: UI.color.border, true: UI.color.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScreenHeader title="Notifications" />
      <View
        className="mx-4 mt-5 rounded-2xl overflow-hidden bg-white"
        style={{ borderWidth: 1, borderColor: UI.color.border }}>
        <NotificationRow
          title="Order updates"
          sub="Track your orders and delivery status"
          value={orderUpdates}
          onValueChange={setOrderUpdates}
        />
        <NotificationRow
          title="Promotions & offers"
          sub="Get exclusive deals and new arrivals"
          value={promotions}
          onValueChange={(v) => {
            setPromotions(v);
            toast('Preferences will sync when backend is configured', 'info');
          }}
          last
        />
      </View>
    </View>
  );
}

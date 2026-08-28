import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { openChatbot } from '../lib/chatbotOpener';
import { UI } from '../lib/ui';

export default function SupportScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const handleAskDootha = () => {
    const message = orderId
      ? `Hi Dootha, I need delivery support for order #${orderId}. Please share support contact details and help me escalate this delay.`
      : "Hi Dootha, I need delivery support. Please share support contact details and help me escalate this issue.";
    router.push('/(tabs)/home');
    setTimeout(() => openChatbot(message), 180);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScreenHeader title="Order support" />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-4 mb-4" style={{ borderWidth: 1, borderColor: UI.color.border }}>
          <Text className="text-base font-semibold" style={{ color: UI.color.ink }}>
            Need help with delivery?
          </Text>
          <Text className="text-sm text-gray-600 mt-2 leading-5">
            Share your issue with Dootha AI first for quick guidance. If still unresolved, contact Growman support.
          </Text>
          {orderId ? (
            <View className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: UI.color.primaryLight }}>
              <Text className="text-xs" style={{ color: UI.color.primaryDark }}>
                Order reference
              </Text>
              <Text className="text-sm font-semibold" style={{ color: UI.color.ink }}>
                #{orderId}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-90 mb-3"
          style={{ backgroundColor: UI.color.primaryDark }}
          onPress={handleAskDootha}>
          <MaterialIcons name="auto-awesome" size={20} color="#fff" />
          <Text className="text-base font-semibold text-white">Ask Dootha AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
          style={{ borderWidth: 1, borderColor: UI.color.border }}
          onPress={() => Linking.openURL('mailto:growman.live@gmail.com')}>
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: UI.color.primaryLight }}>
            <MaterialIcons name="email" size={20} color={UI.color.primary} />
          </View>
          <View className="ml-0 flex-1">
            <Text className="text-sm font-semibold text-gray-900">Email support</Text>
            <Text className="text-sm text-gray-600">growman.live@gmail.com</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#C4C9D1" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: UI.color.border }}
          onPress={() => router.push('/orders')}>
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: UI.color.primaryLight }}>
            <MaterialIcons name="receipt-long" size={20} color={UI.color.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">Go to my orders</Text>
            <Text className="text-sm text-gray-600">Track and view full order details</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#C4C9D1" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

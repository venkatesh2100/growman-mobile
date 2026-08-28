import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { UI } from '../lib/ui';

export default function PaymentMethodsScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScreenHeader title="Payment methods" />
      <View className="flex-1 justify-center items-center px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: UI.color.primaryLight }}>
          <MaterialIcons name="credit-card" size={40} color={UI.color.primary} />
        </View>
        <Text className="text-lg font-semibold text-center mb-2" style={{ color: UI.color.ink }}>
          Secure payments with Razorpay
        </Text>
        <Text className="text-sm text-gray-500 text-center leading-5">
          Pay securely at checkout with UPI, cards, net banking, and wallets. No need to save payment methods.
        </Text>
      </View>
    </View>
  );
}

import { MaterialIcons } from '@expo/vector-icons';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { UI } from '../lib/ui';

export default function HelpCenterScreen() {
  const faqs = [
    { q: 'How do I track my order?', a: 'After placing an order, you\'ll receive a confirmation. Track status in My Orders.' },
    { q: 'What is your return policy?', a: 'Plants are living products. Contact us within 48 hours if there\'s an issue with delivery.' },
    { q: 'How do I care for my plants?', a: 'Each product page has care instructions. You can also chat with Dootha, our plant care assistant.' },
    { q: 'Do you deliver nationwide?', a: 'Yes, we deliver across India. Delivery time varies by location.' },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScreenHeader title="Help center" />
      <ScrollView className="flex-1 px-4 pt-5" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-4 mb-4" style={{ borderWidth: 1, borderColor: UI.color.border }}>
          <Text className="text-base font-semibold mb-3" style={{ color: UI.color.ink }}>
            Frequently asked questions
          </Text>
          {faqs.map((faq, i) => (
            <View
              key={faq.q}
              className={i < faqs.length - 1 ? 'mb-4 pb-4' : ''}
              style={i < faqs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: UI.color.border } : undefined}>
              <Text className="text-sm font-medium text-gray-800 mb-1">{faq.q}</Text>
              <Text className="text-sm text-gray-500 leading-5">{faq.a}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: UI.color.border }}
          onPress={() => Linking.openURL('mailto:support@growman.in')}>
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: UI.color.primaryLight }}>
            <MaterialIcons name="email" size={20} color={UI.color.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">Email support</Text>
            <Text className="text-sm text-gray-500">support@growman.in</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#C4C9D1" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

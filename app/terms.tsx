import React, { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { UI } from '../lib/ui';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-base mb-2" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
        {title}
      </Text>
      <Text className="text-sm text-gray-600 leading-6">{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvas }}>
      <ScreenHeader title="Terms & conditions" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 border border-emerald-100/80">
          <Text className="text-sm text-gray-600 leading-6 mb-6">
            By using Growman, you agree to these terms. If you do not agree, please do not use the service.
          </Text>

          <Section title="Orders">
            All orders are subject to product availability. We may cancel or adjust orders in case of pricing
            errors, stock issues, or events beyond our control. You will be notified of material changes to
            your order where possible.
          </Section>

          <Section title="Pricing">
            Prices are shown in INR unless stated otherwise and may include GST where applicable. Delivery and
            other charges may be added at checkout based on your location and order.
          </Section>

          <Section title="Returns & plants">
            Plants are living products. Please contact us within 48 hours of delivery if there is a problem.
            Refunds or replacements are handled according to our return policy and applicable law.
          </Section>

          <Section title="Use of the app">
            You agree to use the app lawfully, not to misuse or attempt to disrupt the service, and to provide
            accurate information for orders and account details.
          </Section>

          <Section title="Limitation of liability">
            To the maximum extent permitted by law, Growman is not liable for indirect or consequential
            losses arising from use of the service. Nothing in these terms excludes rights that cannot be
            limited under applicable law.
          </Section>

          <Section title="Contact">
            For questions about these terms, email{' '}
            <Text className="font-semibold text-emerald-800">support@growman.in</Text> or visit{' '}
            <Text className="font-semibold text-emerald-800">growman.live</Text>.
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

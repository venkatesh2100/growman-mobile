import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { UI } from '../lib/ui';

const FULL_POLICY_URL =
  'https://www.privacypolicies.com/live/a738b4f7-0288-400a-b2d1-1c6af0406ab4';
const DELETE_ACCOUNT_URL = 'https://growman.live/delete-account';
const SITE_URL = 'https://growman.live/';

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

export default function PrivacyPolicyScreen() {
  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvas }}>
      <ScreenHeader title="Privacy policy" />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 border border-emerald-100/80 mb-4">
          <Text className="text-xs text-gray-500 mb-3">Last updated: March 11, 2026</Text>
          <Text className="text-sm text-gray-600 leading-6 mb-4">
            This Privacy Policy describes how Growman (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects
            your information when you use our app and services. By using Growman, you agree to this policy.
          </Text>
          <Pressable
            onPress={() => open(FULL_POLICY_URL)}
            className="flex-row items-center gap-2 py-3 px-3 rounded-xl bg-emerald-50 border border-emerald-100 active:opacity-90">
            <MaterialIcons name="open-in-new" size={20} color={UI.color.primary} />
            <Text className="text-sm font-semibold flex-1" style={{ color: UI.color.primaryDark }}>
              View full policy on PrivacyPolicies.com
            </Text>
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-emerald-100/80">
          <Section title="Interpretation">
            Capitalized terms in this policy have the meanings given below. Growman refers to our company and
            service. &quot;Personal Data&quot; means information that identifies or can identify you.
          </Section>

          <Section title="Data we collect">
            We may collect: email, name, phone, and delivery address for orders; usage data (e.g. device type,
            IP address, app diagnostics); and, with your permission, location and photos from your camera or
            gallery for features such as plant identification.
          </Section>

          <Section title="How we use your data">
            We use Personal Data to run the service, process orders, manage your account, contact you about
            orders and updates, improve the app, comply with law, and—with your consent—marketing you can
            opt out of. We may share data with service providers (e.g. payments, hosting) who assist our
            operations, subject to contracts and this policy.
          </Section>

          <Section title="Payments">
            Payment card data is handled by our payment partners (e.g. Razorpay). We do not store full card
            numbers on our servers.
          </Section>

          <Section title="Retention">
            We keep data only as long as needed for the purposes above and legal obligations. Account-related
            information may be retained for a period after account closure as described in our full policy.
          </Section>

          <Section title="Delete your data and account">
            You may request deletion of your Personal Data or delete your account. You can use our account
            deletion page:
          </Section>
          <Pressable
            onPress={() => open(DELETE_ACCOUNT_URL)}
            className="mb-5 flex-row items-center gap-2 py-3 px-3 rounded-xl bg-red-50 border border-red-100 active:opacity-90">
            <MaterialIcons name="link" size={20} color="#B91C1C" />
            <Text className="text-sm font-semibold text-red-800 flex-1">{DELETE_ACCOUNT_URL}</Text>
          </Pressable>

          <Section title="Security">
            We use reasonable technical and organizational measures to protect your data. No online transmission
            is 100% secure.
          </Section>

          <Section title="Children">
            Our service is not directed at children under 16. We do not knowingly collect data from children
            under 16 without appropriate consent.
          </Section>

          <Section title="Third-party links">
            Our app may link to other sites. We are not responsible for their privacy practices—please read
            their policies.
          </Section>

          <Section title="Changes">
            We may update this policy and will post the new version here and update the &quot;Last
            updated&quot; date. Material changes may be communicated by email or in-app notice where required.
          </Section>

          <Section title="Contact">
            Questions about this Privacy Policy: visit{' '}
            <Text className="text-emerald-700 font-semibold" onPress={() => open(SITE_URL)}>
              growman.live
            </Text>
            . For the legally complete text, use the link at the top of this screen.
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

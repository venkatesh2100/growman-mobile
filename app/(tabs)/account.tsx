import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showConfirm } from '../../components/Alert';
import DeliveryLocationRow from '../../components/DeliveryLocationRow';
import { openChatbot } from '../../lib/chatbotOpener';
import { UI } from '../../lib/ui';
import { useAuthStore } from '../../store/authStore';
import { formatDeliveryLocation, getFirstName, useUserStore } from '../../store/userStore';

type MenuItem = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  onPress: () => void;
};

function getInitials(name?: string) {
  if (!name?.trim()) return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function MenuGroup({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View className="mb-5 px-4">
      <Text className="text-[15px] font-semibold mb-2.5 px-1" style={{ color: UI.color.ink }}>
        {title}
      </Text>
      <View
        className="rounded-2xl overflow-hidden bg-white"
        style={{ borderWidth: 1, borderColor: UI.color.border }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.75}
            className="flex-row items-center px-4 py-3.5"
            style={index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: UI.color.border } : undefined}
            onPress={item.onPress}>
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: UI.color.canvas }}>
              <MaterialIcons name={item.icon} size={20} color={UI.color.primaryDark} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-gray-900">{item.label}</Text>
              {item.hint ? <Text className="text-xs text-gray-500 mt-0.5">{item.hint}</Text> : null}
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#C4C9D1" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ShortcutTile({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-1 rounded-2xl bg-white px-3 py-4"
      style={{ borderWidth: 1, borderColor: UI.color.border }}>
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2.5"
        style={{ backgroundColor: UI.color.canvas }}>
        <MaterialIcons name={icon} size={22} color={UI.color.primary} />
      </View>
      <Text className="text-[13px] font-semibold text-gray-900">{label}</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { clearAuth, token } = useAuthStore();
  const user = useUserStore((s) => s.user);
  const resetUser = useUserStore((s) => s.reset);

  const handleLogout = () => {
    showConfirm(
      'Sign out of Growman?',
      'You’ll need to sign in again to view orders, wishlist, and saved addresses on this device.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            clearAuth();
            resetUser();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const displayName = user?.name?.trim() ? getFirstName(user.name) : 'Growman member';
  const contactLine = [user?.email, user?.phone].filter(Boolean).join(' · ');
  const locationLabel = formatDeliveryLocation(user?.address);

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {token ? (
          <LinearGradient
            colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 16,
              paddingBottom: 28,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
            }}>
            <Text className="text-sm font-medium mb-4" style={{ color: UI.color.primaryDark }}>
              Account
            </Text>

            <View className="flex-row items-center">
              <View
                className="w-[68px] h-[68px] rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: UI.color.primary }}>
                <Text className="text-2xl font-bold text-white">{getInitials(user?.name)}</Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl mb-1"
                  style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}
                  numberOfLines={1}>
                  {displayName}
                </Text>
                {contactLine ? (
                  <Text className="text-sm text-gray-600 mb-1" numberOfLines={2}>
                    {contactLine}
                  </Text>
                ) : null}
                <DeliveryLocationRow
                  label={locationLabel}
                  ink={UI.color.primaryDark}
                  onPress={() => router.push('/saved-addresses')}
                />
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text className="text-sm font-medium mb-3" style={{ color: UI.color.primaryDark }}>
              Account
            </Text>
            <View
              className="rounded-3xl bg-white p-5"
              style={{ borderWidth: 1, borderColor: UI.color.border }}>
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/icon.png')}
                  className="w-14 h-14 rounded-xl mr-4"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-lg" style={{ color: UI.color.ink, fontFamily: UI.font.displayBold }}>
                    Browse as guest
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1 leading-5">
                    Sign in to save wishlist, track orders, and checkout faster.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="rounded-2xl py-3.5 items-center mb-3"
                style={{ backgroundColor: UI.color.primary }}
                activeOpacity={0.9}
                onPress={() => router.push('/(auth)/phone')}>
                <Text className="text-[15px] font-semibold text-white">Continue with mobile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-2xl py-3.5 items-center border-2"
                style={{ borderColor: UI.color.primary }}
                activeOpacity={0.9}
                onPress={() => router.push('/(auth)')}>
                <Text className="text-[15px] font-semibold" style={{ color: UI.color.primaryDark }}>
                  Other sign-in options
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="px-4 mt-5 mb-5">
          <View className="flex-row gap-3">
            <ShortcutTile icon="shopping-bag" label="Orders" onPress={() => router.push('/orders')} />
            <ShortcutTile icon="favorite-border" label="Wishlist" onPress={() => router.push('/wishlist')} />
            <ShortcutTile icon="storefront" label="Shop" onPress={() => router.replace('/(tabs)/shop')} />
          </View>
        </View>

        {token ? (
          <>
            <MenuGroup
              title="Your details"
              items={[
                {
                  icon: 'location-on',
                  label: 'Saved addresses',
                  hint: 'Delivery locations for checkout',
                  onPress: () => router.push('/saved-addresses'),
                },
                {
                  icon: 'payment',
                  label: 'Payment methods',
                  hint: 'Cards and UPI saved at checkout',
                  onPress: () => router.push('/payment-methods'),
                },
                {
                  icon: 'notifications-none',
                  label: 'Notifications',
                  onPress: () => router.push('/notifications'),
                },
              ]}
            />

            <MenuGroup
              title="Help & support"
              items={[
                {
                  icon: 'auto-awesome',
                  label: 'Ask Dootha',
                  hint: 'Plant care, orders, and delivery help',
                  onPress: () => openChatbot('Hi Dootha, I need help with my Growman account.'),
                },
                {
                  icon: 'help-outline',
                  label: 'Help center',
                  onPress: () => router.push('/help-center'),
                },
                {
                  icon: 'support-agent',
                  label: 'Contact support',
                  onPress: () => router.push('/support'),
                },
              ]}
            />

            <MenuGroup
              title="Legal"
              items={[
                { icon: 'privacy-tip', label: 'Privacy policy', onPress: () => router.push('/privacy-policy') },
                { icon: 'description', label: 'Terms & conditions', onPress: () => router.push('/terms') },
              ]}
            />

            <View className="px-4 mt-1 mb-2">
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.7}
                className="py-3 items-center"
                accessibilityRole="button"
                accessibilityLabel="Log out">
                <Text className="text-[15px] font-semibold text-red-600">Log out</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <MenuGroup
              title="Help & support"
              items={[
                {
                  icon: 'auto-awesome',
                  label: 'Ask Dootha',
                  hint: 'Browse plants and get care tips',
                  onPress: () => openChatbot(),
                },
                { icon: 'help-outline', label: 'Help center', onPress: () => router.push('/help-center') },
                { icon: 'support-agent', label: 'Contact support', onPress: () => router.push('/support') },
              ]}
            />
            <MenuGroup
              title="Legal"
              items={[
                { icon: 'privacy-tip', label: 'Privacy policy', onPress: () => router.push('/privacy-policy') },
                { icon: 'description', label: 'Terms & conditions', onPress: () => router.push('/terms') },
              ]}
            />
          </>
        )}

        <Text className="text-center text-xs text-gray-400 mt-2">Growman · v2.0</Text>
      </ScrollView>
    </View>
  );
}

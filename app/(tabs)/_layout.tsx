import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AnimatedTabIcon } from '../../components/AnimatedTabIcon';
import Chatbot from '../../components/Chatbot';
import SearchModal from '../../components/SearchModal';
import { openChatbot } from '../../lib/chatbotOpener';
import { UI } from '../../lib/ui';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

function UserBootstrap() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);
  const loadUser = useUserStore((s) => s.loadUser);
  const reset = useUserStore((s) => s.reset);

  useEffect(() => {
    if (!hasHydrated) return;
    if (token) {
      void loadUser();
    } else {
      reset();
    }
  }, [hasHydrated, token, loadUser, reset]);

  return null;
}

export default function TabLayout() {
  return (
    <>
      <UserBootstrap />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <SearchModal />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: UI.color.primary,
          tabBarInactiveTintColor: UI.color.muted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          tabBarStyle: {
            backgroundColor: UI.color.surface,
            borderTopWidth: 1,
            borderTopColor: UI.color.border,
            height: 62,
            paddingTop: 4,
            paddingBottom: 6,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                color={color}
                size={size}
                icon="home"
                iconFocused="home"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                color={color}
                size={size}
                icon="store"
                iconFocused="storefront"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                color={color}
                size={size}
                icon="shopping-bag"
                iconFocused="shopping-cart"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openChatbot();
            },
          }}
          options={{
            title: 'Dootha',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                color={color}
                size={size}
                icon="auto-awesome"
                iconFocused="auto-awesome"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          listeners={{
            tabPress: () => {
              const { token } = useAuthStore.getState();
              if (token) void useUserStore.getState().loadUser();
            },
          }}
          options={{
            title: 'Account',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                color={color}
                size={size}
                icon="person-outline"
                iconFocused="person"
              />
            ),
          }}
        />
      </Tabs>
      <Chatbot />
    </>
  );
}

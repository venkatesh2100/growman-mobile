import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar  } from 'react-native';
import Chatbot from '../../components/Chatbot';
import SearchModal from '../../components/SearchModal';
import { openChatbot } from '../../lib/chatbotOpener';

export default function TabLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <SearchModal />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="store" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="shopping-cart" size={size} color={color} />
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
            tabBarIcon: ({ color, size }) => (
              // <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="auto-awesome" size={size} color={color} />
              // </View>
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>
      <Chatbot />
    </>
  );
}

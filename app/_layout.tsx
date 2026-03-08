import { Slot, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import  { ToastContainer } from '../components/Toast';
import Chatbot from '@/components/Chatbot';
import './global.css';

export default function RootLayout() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Render Slot first so Expo Router mounts the navigator immediately */}
        {!mounted ? (
          <Slot />
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
        <ToastContainer />
        <Chatbot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
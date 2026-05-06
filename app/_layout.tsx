import { Slot, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AlertContainer } from '../components/Alert';
import { ToastContainer } from '../components/Toast';
import './global.css';

export default function RootLayout() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const apply = async () => {
      // Make Android draw edge-to-edge and remove any translucent contrast scrim.
      await NavigationBar.setPositionAsync('absolute');
      await NavigationBar.setBackgroundColorAsync('#00000000'); // transparent
      await NavigationBar.setButtonStyleAsync('dark');
    };
    apply().catch((e) => {
      console.warn('Failed to configure Android navigation bar', e);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaProvider>
        {/* Render Slot first so Expo Router mounts the navigator immediately */}
        {!mounted ? (
          <Slot />
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
        <ToastContainer />
        <AlertContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
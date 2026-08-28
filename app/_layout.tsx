import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertContainer } from '../components/Alert';
import { ToastContainer } from '../components/Toast';
import './global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    Fraunces_500Medium_Italic,
    Fraunces_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <ToastContainer />
        <AlertContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
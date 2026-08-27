import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/** Light auth screens (gray-50) need dark status-bar icons; tabs layout uses its own StatusBar when shown. */
const AUTH_SCREEN_BG = '#F9FAFB';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={AUTH_SCREEN_BG} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AUTH_SCREEN_BG } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="phone" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </>
  );
}

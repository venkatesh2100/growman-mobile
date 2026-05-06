import { Stack } from 'expo-router';
import { SignupDraftProvider } from '../../../lib/signupDraftContext';

export default function SignupFlowLayout() {
  return (
    <SignupDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="password" />
        <Stack.Screen name="verify" />
      </Stack>
    </SignupDraftProvider>
  );
}

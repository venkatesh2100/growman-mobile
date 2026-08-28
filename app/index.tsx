import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

export default function Index() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const isUserLoaded = useUserStore((s) => s.isLoaded);
  const loadUser = useUserStore((s) => s.loadUser);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadUser();
    }
  }, [hasHydrated, isAuthenticated, loadUser]);

  if (!hasHydrated || (isAuthenticated && !isUserLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)" />;
}

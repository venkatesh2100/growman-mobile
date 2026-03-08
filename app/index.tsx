import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const hasMounted = useRef(false);

  useEffect(() => {
    // Small defer ensures Root Layout is mounted before navigation
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Show spinner while redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );
}
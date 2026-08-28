import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { showConfirm } from '../components/Alert';
import { toast } from '../components/Toast';
import { hasDeliveryLocation, useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';

/** Prompt once per screen mount when no delivery location is set. */
export function useLocationPrompt(enabled = true) {
  const promptedRef = useRef(false);
  const token = useAuthStore((s) => s.token);
  const isLoaded = useUserStore((s) => s.isLoaded);
  const getEffectiveLocation = useUserStore((s) => s.getEffectiveLocation);
  const detectAndSaveLocation = useUserStore((s) => s.detectAndSaveLocation);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || promptedRef.current) return;
      if (token && !isLoaded) return;

      const location = getEffectiveLocation();
      if (hasDeliveryLocation(location)) return;

      promptedRef.current = true;
      showConfirm(
        'Set delivery location',
        'Share your location so we can show delivery options and availability near you.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Allow location',
            onPress: () => {
              void detectAndSaveLocation()
                .then((addr) => {
                  if (addr) toast('Location updated', 'success');
                })
                .catch(() => {
                  toast('Could not detect location. Set it manually from Account.', 'error');
                });
            },
          },
        ]
      );
    }, [enabled, token, isLoaded, getEffectiveLocation, detectAndSaveLocation])
  );
}

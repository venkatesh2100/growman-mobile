import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { hasDeliveryLocation, useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';

/** Request location once per screen mount when no delivery location is set. */
export function useLocationPrompt(enabled = true) {
  const promptedRef = useRef(false);
  const [locating, setLocating] = useState(false);
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
      setLocating(true);
      void detectAndSaveLocation()
        .catch(() => {
          // Permission denied or lookup failed — row stays hidden until location exists.
        })
        .finally(() => setLocating(false));
    }, [enabled, token, isLoaded, getEffectiveLocation, detectAndSaveLocation])
  );

  return { locating };
}

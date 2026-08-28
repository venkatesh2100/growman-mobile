import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';
import { indianStates } from '../lib/data/indianStatesCities';
import { UserAddress, UserProfile } from '../lib/types';
import { getCurrentLocation } from '../lib/utils/geolocation';
import { useAuthStore } from './authStore';

export function getFirstName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'Growman';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function formatDeliveryLocation(address?: UserAddress | null): string | null {
  if (!address) return null;
  const cityPin = [address.city, address.pincode].filter(Boolean).join(', ');
  if (cityPin) return cityPin;
  if (address.state) return address.state;
  if (address.line) return address.line;
  return null;
}

export function hasDeliveryLocation(address?: UserAddress | null): boolean {
  return Boolean(address?.city?.trim() || address?.pincode?.trim() || address?.line?.trim());
}

interface UserStore {
  user: UserProfile | null;
  localLocation: UserAddress | null;
  isLoaded: boolean;
  loadUser: () => Promise<void>;
  setLocalLocation: (location: UserAddress | null) => void;
  detectAndSaveLocation: () => Promise<UserAddress | null>;
  getEffectiveLocation: () => UserAddress | null;
  getLocationLabel: () => string | null;
  reset: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      localLocation: null,
      isLoaded: true,

      loadUser: async () => {
        const token = useAuthStore.getState().token;
        if (!token) {
          set({ user: null, isLoaded: true });
          return;
        }
        set({ isLoaded: false });
        try {
          const response = await apiFetch('/auth/me');
          if (response.ok) {
            const data = (await response.json()) as UserProfile;
            set({ user: data, isLoaded: true });
          } else {
            set({ user: null, isLoaded: true });
          }
        } catch (error) {
          console.error('Error loading user:', error);
          set({ isLoaded: true });
        }
      },

      setLocalLocation: (location) => set({ localLocation: location }),

      getEffectiveLocation: () => {
        const { user, localLocation } = get();
        if (user?.address && hasDeliveryLocation(user.address)) return user.address;
        if (localLocation && hasDeliveryLocation(localLocation)) return localLocation;
        return null;
      },

      getLocationLabel: () => formatDeliveryLocation(get().getEffectiveLocation()),

      detectAndSaveLocation: async () => {
        const locationData = await getCurrentLocation();

        let matchedState = locationData.state || '';
        if (locationData.state) {
          const stateMatch = indianStates.find(
            (state) =>
              state.name.toLowerCase().includes(locationData.state!.toLowerCase()) ||
              locationData.state!.toLowerCase().includes(state.name.toLowerCase())
          );
          if (stateMatch) matchedState = stateMatch.name;
        }

        const address: UserAddress = {
          line: locationData.addressLine || '',
          city: locationData.city || '',
          state: matchedState,
          pincode: locationData.pincode || '',
          country: locationData.country || 'India',
          latitude: locationData.latitude ?? null,
          longitude: locationData.longitude ?? null,
        };

        const token = useAuthStore.getState().token;
        if (token && locationData.latitude && locationData.longitude) {
          const response = await apiFetch('/auth/save-location', {
            method: 'POST',
            body: JSON.stringify({
              addressLine: address.line,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              country: address.country,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            }),
          });
          if (response.ok) {
            await get().loadUser();
            return get().user?.address ?? address;
          }
        }

        set({ localLocation: address });
        return address;
      },

      reset: () => set({ user: null, isLoaded: true }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ localLocation: state.localLocation }),
    }
  )
);

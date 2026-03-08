// Geolocation utility functions for React Native

import * as Location from 'expo-location';

export interface LocationData {
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get user's current location using Expo Location API
 */
export async function getCurrentLocation(): Promise<LocationData> {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode to get address
    try {
      const addressData = await reverseGeocode(latitude, longitude);
      return {
        ...addressData,
        latitude,
        longitude,
      };
    } catch {
      // If reverse geocoding fails, return just coordinates
      return {
        latitude,
        longitude,
        country: 'India',
      };
    }
  } catch (error) {
    throw new Error(`Geolocation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en&zoom=18`,
      {
        headers: {
          'User-Agent': 'Growman App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};
    const displayName = data.display_name || '';

    const locationData: LocationData = {
      country: address.country || 'India',
    };

    // Extract city
    locationData.city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      address.municipality ||
      '';

    // Extract state
    locationData.state =
      address.state ||
      address.region ||
      address.state_district ||
      '';

    // Extract pincode
    locationData.pincode = address.postcode || '';

    // Build address line
    const addressParts: string[] = [];
    if (address.house_number) {
      addressParts.push(address.house_number);
    }
    if (address.building) {
      addressParts.push(address.building);
    }
    if (address.road) {
      addressParts.push(address.road);
    }
    if (address.neighbourhood) {
      addressParts.push(address.neighbourhood);
    }
    if (address.suburb && address.suburb !== locationData.city) {
      addressParts.push(address.suburb);
    }

    if (addressParts.length > 0) {
      locationData.addressLine = addressParts.join(', ');
    } else if (displayName) {
      const parts = displayName.split(',');
      locationData.addressLine = parts[0] || '';
    }

    // Fallback city extraction from display_name
    if (!locationData.city && displayName) {
      const parts = displayName.split(',');
      for (let i = 1; i < parts.length - 2; i++) {
        const part = parts[i].trim();
        if (part && part.length > 2) {
          locationData.city = part;
          break;
        }
      }
    }

    // Fallback state extraction
    if (!locationData.state && displayName) {
      const parts = displayName.split(',');
      for (let i = parts.length - 2; i >= 0; i--) {
        const part = parts[i].trim();
        if (part && part.length > 3 && !/^\d+$/.test(part)) {
          locationData.state = part;
          break;
        }
      }
    }

    // Fallback pincode extraction
    if (!locationData.pincode && displayName) {
      const pincodeMatch = displayName.match(/\b[1-9][0-9]{5}\b/);
      if (pincodeMatch) {
        locationData.pincode = pincodeMatch[0];
      }
    }

    return locationData;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}


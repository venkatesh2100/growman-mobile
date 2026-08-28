import { API_URL } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';

/**
 * Get the base API URL from environment variable or default to local API
 */
export function getApiUrl(): string {
  // console.debug(API_URL, "API URL")
  return API_URL || '';
}

/**
 * Resolve JWT from zustand or AsyncStorage (handles persist rehydration lag).
 */
export async function resolveAuthToken(): Promise<string | null> {
  const fromStore = useAuthStore.getState().token;
  if (fromStore) return fromStore;

  try {
    const stored = await AsyncStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string } };
      if (parsed.state?.token) return parsed.state.token;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Fetch from the external API
 * Automatically includes Authorization header if token is available
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const apiUrl = getApiUrl();
  const url = path.startsWith('/') ? `${apiUrl}${path}` : `${apiUrl}/${path}`;

  const token = await resolveAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Search products by query string
 */
export async function searchProducts(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  if (!query || query.trim() === '') {
    return {
      data: [],
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  try {
    const res = await apiFetch(
      `/products/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    );
    if (!res.ok) {
      throw new Error('Failed to search products');
    }
    const result = await res.json();
    // Handle paginated response
    if (result.data && result.pagination) {
      return result;
    }
    // Fallback for non-paginated response
    return {
      data: Array.isArray(result) ? result : [],
      pagination: {
        page: 1,
        pageSize,
        total: result.length || 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      data: [],
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

/**
 * Identify plant from image using Pl@ntNet API (proxied via backend)
 */
export async function identifyPlant(imageUri: string): Promise<{
  bestMatch?: string;
  results?: Array<{ score: number; species?: { scientificName?: string; commonNames?: string[] } }>;
  remainingIdentificationRequests?: number;
}> {
  const apiUrl = getApiUrl();
  // Prefer /images/identify-plant for Cloud Run; backend also has /plants/identify
  const url = `${apiUrl}/images/identify-plant`;

  const authStore = useAuthStore.getState();
  const token = authStore.token;
  // console.log('token', token);
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plant.jpg',
  } as any);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
//  console.log('response', response);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || 'Plant identification failed');
  }

  return response.json();
}

/** Normalize to MSG91 format: digits only with country code, e.g. 919876543210 */
export function toMsg91Phone(tenDigitOrE164: string): string {
  const digits = tenDigitOrE164.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export const sendOtp = (phone: string, reqId?: string, channel?: number) =>
  apiFetch('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      phone: toMsg91Phone(phone),
      ...(reqId ? { reqId } : {}),
      // MSG91 expects string channel codes ("11","12","4"); send both names for clarity
      ...(channel != null
        ? { channel: String(channel), retryChannel: String(channel) }
        : {}),
    }),
  });

export const verifyOtp = (phone: string, otp: string, reqId?: string) =>
  apiFetch('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone: toMsg91Phone(phone), otp, ...(reqId ? { reqId } : {}) }),
  });

/** After MSG91 DefaultWidget success — exchange access-token for Growman JWT */
export const verifyWidgetOtp = (accessToken: string, identifier?: string) =>
  apiFetch('/auth/otp/widget/verify', {
    method: 'POST',
    body: JSON.stringify({ accessToken, ...(identifier ? { identifier } : {}) }),
  });

export const completeProfile = (name: string, email?: string) =>
  apiFetch('/auth/profile/complete', {
    method: 'POST',
    body: JSON.stringify({ name, ...(email ? { email } : {}) }),
  });

/** Exchange Truecaller Android OAuth code for Growman JWT (server-side token + userinfo). */
export const verifyTruecaller = (authorizationCode: string, codeVerifier: string) =>
  apiFetch('/auth/truecaller', {
    method: 'POST',
    body: JSON.stringify({ authorizationCode, codeVerifier }),
  });


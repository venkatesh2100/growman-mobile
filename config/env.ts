import { Platform } from 'react-native';

/**
 * Defaults are for local dev only. Set EXPO_PUBLIC_API_URL in .env for your setup.
 *
 * - iOS simulator / web: localhost reaches your machine.
 * - Android emulator: host machine is http://10.0.2.2 (not localhost on the device).
 * - Physical Android (USB): either set EXPO_PUBLIC_API_URL to your PC's LAN IP
 *   (same Wi‑Fi, server must listen on 0.0.0.0), or run `adb reverse tcp:8080 tcp:8080`
 *   and use http://127.0.0.1:8080/api/v1 (device localhost then forwards to the PC).
 */
const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080/api/v1'
  : 'http://localhost:8080/api/v1';
// console.debug(process.env.EXPO_PUBLIC_API_URL, "API URL")
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const GOOGLE_AN_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID ?? '';
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

// console.log(GOOGLE_CLIENT_ID);
// console.log(API_URL);

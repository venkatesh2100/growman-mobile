import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://172.21.6.155:8080/api/v1' // Android emulator → host machine localhost
  : 'http://localhost:8080/api/v1'; // iOS simulator / web
// Prefer EXPO_PUBLIC_API_URL (Cloud Run or LAN IP). Physical devices cannot use localhost.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\s/g, '');
if (__DEV__) {
  console.debug('[API]', API_URL);
}
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const GOOGLE_AN_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID ?? '';
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

/** MSG91 OTP Widget (client token — not the account Authkey) */
export const MSG91_WIDGET_ID = (process.env.EXPO_PUBLIC_MSG91_WIDGET_ID ?? '').trim();
export const MSG91_TOKEN_AUTH = (process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH ?? '').trim();

/** Truecaller Android OAuth client id (developer.truecaller.com) */
export const TRUECALLER_ANDROID_CLIENT_ID = (
  process.env.EXPO_PUBLIC_TRUECALLER_ANDROID_CLIENT_ID ?? ''
).trim();

export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

// console.log(GOOGLE_CLIENT_ID);
// console.log(API_URL);

import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://192.168.1.8:8080/api/v1'  // Android emulator
  : 'http://localhost:8080/api/v1'; // iOS simulator / web

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

// console.log(GOOGLE_CLIENT_ID);
// console.log(API_URL);

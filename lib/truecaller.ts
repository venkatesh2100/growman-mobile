import { Platform } from 'react-native';
import { API_URL, TRUECALLER_ANDROID_CLIENT_ID } from '../config/env';
import { verifyTruecaller } from './api';

export type TruecallerAuthResult =
  | { ok: true; token: string; isNewUser: boolean }
  | { ok: false; reason: 'unavailable' | 'cancelled' | 'error'; message?: string };

let initPromise: Promise<boolean> | null = null;

const CANCEL_CODES = new Set([
  'ERR_USER_CANCELLED',
  'ERR_USER_DISMISSED',
  'ERR_USER_PRESSED_BACK',
]);

export function isTruecallerConfigured(): boolean {
  return Platform.OS === 'android' && Boolean(TRUECALLER_ANDROID_CLIENT_ID);
}

/** Returns true when Truecaller app is installed and OAuth is usable. */
export async function ensureTruecallerReady(): Promise<boolean> {
  if (!isTruecallerConfigured()) return false;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { initializeAsync } = await import('expo-truecaller');
        const res = await initializeAsync({
          consentMode: 'bottomsheet',
          heading: 'logInTo',
          buttonShape: 'rounded',
          footerType: 'skip',
        });
        return Boolean(res?.isUsable);
      } catch (err) {
        console.warn('[Truecaller] init failed', err);
        return false;
      }
    })();
  }
  return initPromise;
}

/**
 * One-tap Truecaller verify → Growman JWT.
 * No SMS / MSG91. Caller should fall back to OTP on unavailable/cancelled.
 */
export async function signInWithTruecaller(): Promise<TruecallerAuthResult> {
  if (!(await ensureTruecallerReady())) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const { verifyUserAsync } = await import('expo-truecaller');
    const oauth = await verifyUserAsync({
      scopes: ['profile', 'phone', 'email'],
    });

    const res = await verifyTruecaller(oauth.authorizationCode, oauth.codeVerifier);
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      isNewUser?: boolean;
    };
    if (!res.ok || !data.token) {
      return {
        ok: false,
        reason: 'error',
        message: data.error || "Couldn't finish Truecaller sign-in.",
      };
    }
    return { ok: true, token: data.token, isNewUser: Boolean(data.isNewUser) };
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
    if (CANCEL_CODES.has(code)) {
      return { ok: false, reason: 'cancelled' };
    }
    console.error('[Truecaller] verify failed', API_URL, err);
    const message =
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message: string }).message)
        : 'Truecaller unavailable. Continue with SMS.';
    return { ok: false, reason: 'error', message };
  }
}

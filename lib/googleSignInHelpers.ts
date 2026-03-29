import { GoogleSignin } from '@react-native-google-signin/google-signin';

/** Clears the in-app Google session so the next sign-in shows the account picker. */
export async function clearGoogleSessionForAccountPicker(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* no session or already signed out */
  }
}

export type SignInTokenResult =
  | { kind: 'cancelled' }
  | { kind: 'failed' }
  | { kind: 'token'; idToken: string };

export async function signInForIdToken(): Promise<SignInTokenResult> {
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    return { kind: 'cancelled' };
  }
  if (result.type !== 'success' || !result.data) {
    return { kind: 'failed' };
  }
  let idToken = result.data.idToken;
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    } catch {
      return { kind: 'failed' };
    }
  }
  if (!idToken) {
    return { kind: 'failed' };
  }
  return { kind: 'token', idToken };
}

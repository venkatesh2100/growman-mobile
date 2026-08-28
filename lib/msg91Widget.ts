import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { MSG91_TOKEN_AUTH, MSG91_WIDGET_ID } from '../config/env';

export function isMsg91WidgetConfigured(): boolean {
  return Boolean(MSG91_WIDGET_ID && MSG91_TOKEN_AUTH);
}

export async function ensureMsg91Widget(): Promise<void> {
  if (!isMsg91WidgetConfigured()) {
    throw new Error('MSG91 widget ID / tokenAuth missing from env');
  }
  await OTPWidget.initializeWidget(MSG91_WIDGET_ID, MSG91_TOKEN_AUTH);
}

type Msg91SendResult =
  | { kind: 'otp_sent'; reqId: string }
  | { kind: 'already_verified'; accessToken: string }
  | { kind: 'error'; message: string };

type Msg91VerifyResult =
  | { kind: 'ok'; accessToken: string }
  | { kind: 'error'; message: string };

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** Send OTP via MSG91 widget APIs (no DefaultWidget / getWidgetProcess). */
export async function msg91SendOtp(tenDigitPhone: string): Promise<Msg91SendResult> {
  await ensureMsg91Widget();
  const identifier = `91${tenDigitPhone.replace(/\D/g, '').slice(-10)}`;
  const raw = await OTPWidget.sendOTP({ identifier });
  const res = asRecord(raw);

  const type = String(res.type || res.status || '').toLowerCase();
  const accessToken = pickString(res['access-token'], res.accessToken);
  if (accessToken || res.invisibleVerified === true) {
    return {
      kind: 'already_verified',
      accessToken: accessToken || pickString(res.message),
    };
  }

  // Success payload usually puts reqId in `message`
  const reqId = pickString(res.message, res.reqId, res.requestId);
  if (type === 'success' || type === 'ok' || reqId) {
    if (!reqId) {
      return { kind: 'error', message: "Couldn't start OTP. Check MSG91 Mobile Integration is enabled." };
    }
    return { kind: 'otp_sent', reqId };
  }

  return {
    kind: 'error',
    message: pickString(res.message, res.error) || "Couldn't send OTP. Try again.",
  };
}

export async function msg91VerifyOtp(reqId: string, otp: string): Promise<Msg91VerifyResult> {
  await ensureMsg91Widget();
  const raw = await OTPWidget.verifyOTP({ reqId, otp });
  const res = asRecord(raw);
  const type = String(res.type || res.status || '').toLowerCase();
  const accessToken = pickString(res['access-token'], res.accessToken, res.message);

  if ((type === 'success' || type === 'ok' || res['access-token']) && accessToken) {
    return { kind: 'ok', accessToken };
  }

  return {
    kind: 'error',
    message: pickString(res.message, res.error) || "That code didn't match. Try again.",
  };
}

export async function msg91RetryOtp(reqId: string): Promise<Msg91SendResult> {
  await ensureMsg91Widget();
  const raw = await OTPWidget.retryOTP({ reqId, retryChannel: 11 });
  const res = asRecord(raw);
  const type = String(res.type || res.status || '').toLowerCase();
  const newReqId = pickString(res.message, res.reqId, res.requestId);

  if (type === 'success' || type === 'ok' || newReqId) {
    return { kind: 'otp_sent', reqId: newReqId || reqId };
  }

  return {
    kind: 'error',
    message: pickString(res.message, res.error) || "Couldn't resend OTP. Try again.",
  };
}

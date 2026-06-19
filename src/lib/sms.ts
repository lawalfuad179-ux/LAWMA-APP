import { logger } from '@/lib/logger';

function getAtCredentials() {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
  const from = process.env.AFRICASTALKING_FROM;
  if (!apiKey) {
    throw new Error('AFRICASTALKING_API_KEY is not configured.');
  }
  return { apiKey, username, from };
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<boolean> {
  // Mock only when no real key is configured. NODE_ENV is intentionally NOT checked —
  // a real API key in .env should send even during local development.
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const isMock = !apiKey || apiKey === 'sandbox';

  if (isMock) {
    logger.info('sms.otp.mock_sent', {
      phoneNumber,
      code,
      message: `[MOCK] OTP for ${phoneNumber}: ${code}`,
    });
    return true;
  }

  try {
    const { apiKey, username, from } = getAtCredentials();
    const encoded = new URLSearchParams({
      username,
      to: phoneNumber,
      message: `Your LAWMA OTP is ${code}. Valid for 5 minutes.`,
    });
    if (from) encoded.set('from', from);

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey,
      },
      body: encoded,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logger.error('sms.otp.error', { phoneNumber, error: `Non-JSON response from provider: ${text.slice(0, 200)}` });
      return false;
    }
    const d = data as { SMSMessageData?: { Recipients?: Array<{ status: string; messageId: string }> } };
    if (d.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      logger.info('sms.otp.sent', { phoneNumber, messageId: data.SMSMessageData.Recipients[0].messageId });
      return true;
    }

    logger.error('sms.otp.failed', { phoneNumber, response: d });
    return false;
  } catch (error) {
    logger.error('sms.otp.error', { phoneNumber, error: String(error) });
    return false;
  }
}

export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();
  return code.slice(0, 6);
}

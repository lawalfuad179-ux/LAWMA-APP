import { logger } from '@/lib/logger';

function toInternational(phoneNumber: string): string {
  // Convert local Nigerian numbers (07xxx, 08xxx, 09xxx) to +234 format
  if (/^0[789]\d{9}$/.test(phoneNumber)) {
    return '+234' + phoneNumber.slice(1);
  }
  // Already has + prefix or is in another format — pass through
  return phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
}

/**
 * Send a transactional SMS via Brevo. Never throws — a failed text must never
 * take down the flow that triggered it (money moves first, messages follow).
 * Without an API key it logs a mock send so local flows stay demonstrable.
 */
export async function sendSms(phoneNumber: string, content: string, kind = 'generic'): Promise<boolean> {
  const apiKey = process.env.BREVO_SMS_API_KEY;

  if (!apiKey) {
    logger.info(`sms.${kind}.mock_sent`, {
      phoneNumber,
      message: `[MOCK] SMS to ${phoneNumber}: ${content}`,
    });
    return true;
  }

  try {
    const sender = process.env.BREVO_SMS_SENDER || 'LAWMA';
    const recipient = toInternational(phoneNumber);

    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ sender, recipient, content, type: 'transactional' }),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logger.error(`sms.${kind}.error`, { phoneNumber, error: `Non-JSON response from Brevo: ${text.slice(0, 200)}` });
      return false;
    }

    if (res.ok) {
      const d = data as { messageId?: string };
      logger.info(`sms.${kind}.sent`, { phoneNumber: recipient, messageId: d.messageId });
      return true;
    }

    logger.error(`sms.${kind}.failed`, { phoneNumber, status: res.status, response: data });
    return false;
  } catch (error) {
    logger.error(`sms.${kind}.error`, { phoneNumber, error: String(error) });
    return false;
  }
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<boolean> {
  return sendSms(phoneNumber, `Your LAWMA OTP is ${code}. Valid for 5 minutes.`, 'otp');
}

export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();
  return code.slice(0, 6);
}

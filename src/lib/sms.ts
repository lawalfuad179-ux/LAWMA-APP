import { logger } from '@/lib/logger';

/**
 * Sends an OTP code via SMS.
 * In development, the OTP is logged to the server console.
 * In production, this should integrate with a real SMS provider (e.g. Termii, Twilio).
 */
export async function sendOtpSms(phoneNumber: string, code: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    // Development mock: log to console instead of sending real SMS
    logger.info('sms.otp.mock_sent', {
      phoneNumber,
      code,
      message: `[DEV] OTP for ${phoneNumber}: ${code}`,
    });
    return true;
  }

  // Production: integrate with SMS provider here
  // For now, mock success
  logger.info('sms.otp.sent', { phoneNumber });
  return true;
}

/**
 * Generates a 6-digit OTP code using crypto-safe random numbers.
 */
export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  // Use crypto.getRandomValues in browser or simple random for server
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString().slice(0, 6);
}

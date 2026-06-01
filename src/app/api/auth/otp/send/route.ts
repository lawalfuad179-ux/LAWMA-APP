import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { generateOtpCode, sendOtpSms } from '@/lib/sms';
import { OTP_EXPIRY_MINUTES, OTP_COOLDOWN_SECONDS, OTP_LENGTH } from '@/constants';

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^\+?[0-9]+$/),
});

type Success = { ok: true; data: { expiresInMinutes: number } };
type Failure = { ok: false; error: { code: string; message: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Enter a valid phone number.' } },
        { status: 400 },
      );
    }

    const { phoneNumber } = parsed.data;

    // Check cooldown: prevent OTP resend within 60 seconds
    const recentOtp = await db.otpCode.findFirst({
      where: { phoneNumber, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const elapsed = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
      if (elapsed < OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - elapsed);
        return NextResponse.json<Failure>(
          {
            ok: false,
            error: { code: 'cooldown_active', message: `Please wait ${remaining} seconds before requesting a new code.` },
          },
          { status: 429 },
        );
      }
    }

    // Invalidate any previous unused OTPs for this number
    await db.otpCode.updateMany({
      where: { phoneNumber, isUsed: false },
      data: { isUsed: true },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.otpCode.create({
      data: { phoneNumber, code, expiresAt },
    });

    await sendOtpSms(phoneNumber, code);

    logger.info('auth.otp.sent', { phoneNumber });

    return NextResponse.json<Success>({
      ok: true,
      data: { expiresInMinutes: OTP_EXPIRY_MINUTES },
    });
  } catch (error) {
    logger.error('auth.otp.send_failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

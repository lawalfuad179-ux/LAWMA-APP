import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { generateOtpCode, sendOtpSms } from '@/lib/sms';
import { enqueueEmail } from '@/lib/email/enqueue';
import { OTP_EXPIRY_MINUTES, OTP_COOLDOWN_SECONDS } from '@/constants';

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^\+?[0-9]+$/).optional(),
  email: z.string().email().max(200).optional(),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email is required.' });

type Success = { ok: true; data: { expiresInMinutes: number } };
type Failure = { ok: false; error: { code: string; message: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Enter a valid phone number or email.' } },
        { status: 400 },
      );
    }

    const { phoneNumber, email } = parsed.data;
    const identifier = phoneNumber || email || '';
    const isEmail = !!email;

    // Check cooldown
    const recentOtp = await db.otpCode.findFirst({
      where: { phoneNumber: identifier, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const elapsed = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
      if (elapsed < OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - elapsed);
        return NextResponse.json<Failure>(
          { ok: false, error: { code: 'cooldown_active', message: `Please wait ${remaining} seconds before requesting a new code.` } },
          { status: 429 },
        );
      }
    }

    // Invalidate previous unused OTPs
    await db.otpCode.updateMany({
      where: { phoneNumber: identifier, isUsed: false },
      data: { isUsed: true },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.otpCode.create({
      data: { phoneNumber: identifier, code, expiresAt },
    });

    if (isEmail) {
      await enqueueEmail(email, 'Your LAWMA verification code', 'password-reset', { code });
    } else {
      await sendOtpSms(phoneNumber || '', code);
    }

    logger.info('auth.otp.sent', { identifier, isEmail });

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

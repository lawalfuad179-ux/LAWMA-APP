import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { forgotPasswordSchema, normalizePhone } from '@/lib/validators/auth';
import { track } from '@/lib/analytics';
import { generateOtpCode, sendOtpSms } from '@/lib/sms';
import { OTP_EXPIRY_MINUTES } from '@/constants';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { expiresInMinutes: number } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    const { phoneNumber } = parsed.data;
    const normalizedPhone = normalizePhone(phoneNumber);

    const resident = await db.resident.findUnique({ where: { phoneNumber: normalizedPhone } });

    if (resident) {
      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await db.otpCode.create({
        data: { phoneNumber: normalizedPhone, code, expiresAt },
      });

      await sendOtpSms(normalizedPhone, code);
      track('password_reset_requested', { residentId: resident.id });
    }

    return NextResponse.json<Success>({
      ok: true,
      data: { expiresInMinutes: OTP_EXPIRY_MINUTES },
    });
  } catch (error) {
    logger.error('auth.forgot_password.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

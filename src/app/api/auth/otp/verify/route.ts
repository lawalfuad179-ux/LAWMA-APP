import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createSession } from '@/lib/auth';
import { OTP_EXPIRY_MINUTES } from '@/constants';

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^\+?[0-9]+$/),
  code: z.string().length(6).regex(/^[0-9]+$/),
});

type Success = { ok: true; data: { residentId: string; isNewResident: boolean } };
type Failure = { ok: false; error: { code: string; message: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Invalid verification code.' } },
        { status: 400 },
      );
    }

    const { phoneNumber, code } = parsed.data;

    // Find the most recent unused OTP for this number
    const otpRecord = await db.otpCode.findFirst({
      where: { phoneNumber, code, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_code', message: 'Incorrect code. Please try again.' } },
        { status: 400 },
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json<Failure>(
        {
          ok: false,
          error: { code: 'code_expired', message: `Code expired. Request a new one.` },
        },
        { status: 400 },
      );
    }

    // Mark OTP as used
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Find or create resident
    let resident = await db.resident.findUnique({
      where: { phoneNumber },
    });

    const isNewResident = !resident;

    if (!resident) {
      resident = await db.resident.create({
        data: { phoneNumber },
      });
    }

    // Create session (sets httpOnly cookie)
    await createSession(resident.id);

    logger.info('auth.otp.verified', { residentId: resident.id, isNewResident });

    return NextResponse.json<Success>({
      ok: true,
      data: { residentId: resident.id, isNewResident },
    });
  } catch (error) {
    logger.error('auth.otp.verify_failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

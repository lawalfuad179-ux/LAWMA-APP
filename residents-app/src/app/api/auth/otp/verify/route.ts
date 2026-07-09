import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createSession } from '@/lib/auth';

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^\+?[0-9]+$/).optional(),
  email: z.string().email().max(200).optional(),
  code: z.string().length(6).regex(/^[0-9]+$/),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email required.' });

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

    const { phoneNumber, email, code } = parsed.data;
    const identifier = phoneNumber || email || '';

    // Find the OTP record
    const otpRecord = await db.otpCode.findFirst({
      where: { phoneNumber: identifier, code, isUsed: false },
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
        { ok: false, error: { code: 'code_expired', message: 'Code expired. Request a new one.' } },
        { status: 400 },
      );
    }

    // Mark OTP as used
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Find or create resident by phone or email
    let resident = email
      ? await db.resident.findUnique({ where: { email } })
      : await db.resident.findUnique({ where: { phoneNumber: identifier } });

    const isNewResident = !resident;

    if (!resident) {
      const createData: { phoneNumber: string; email?: string } = {
        phoneNumber: identifier,
      };
      if (email) createData.email = identifier;
      resident = await db.resident.create({ data: createData });
    }

    // Create session
    await createSession(resident.id);

    logger.info('auth.otp.verified', { residentId: resident.id, isNewResident, hasEmail: !!email });

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

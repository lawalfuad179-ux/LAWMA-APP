import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true };

const schema = z.object({
  phoneNumber: z.string().min(10).max(15).regex(/^\+?[0-9]+$/).optional(),
  email: z.string().email().max(200).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
}).refine((d) => d.phoneNumber || d.email, { message: 'Phone number or email required.' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    const { phoneNumber, email, password } = parsed.data;
    const identifier = email || phoneNumber || '';

    // Verify the user went through the OTP flow by checking for a valid OTP in the DB
    const otpRecord = await db.otpCode.findFirst({
      where: { phoneNumber: identifier, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'session_expired', message: 'Your session has expired. Go back and try again.' } },
        { status: 401 },
      );
    }

    const resident = email
      ? await db.resident.findUnique({ where: { email: identifier } })
      : await db.resident.findUnique({ where: { phoneNumber: identifier } });

    if (!resident) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'not_found', message: 'Account not found.' } },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.resident.update({ where: { id: resident.id }, data: { passwordHash } }),
      db.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } }),
    ]);

    await createSession(resident.id);

    logger.info('auth.create_password.success', { residentId: resident.id });
    return NextResponse.json<Success>({ ok: true });
  } catch (error) {
    logger.error('auth.create_password.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

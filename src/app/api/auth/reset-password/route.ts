import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { resetPasswordSchema, normalizePhone } from '@/lib/validators/auth';
import { track } from '@/lib/analytics';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { message: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    const { phoneNumber, email, code, password } = parsed.data;
    const identifier = email || normalizePhone(phoneNumber || '');
    const isEmail = !!email;

    const otpRecord = await db.otpCode.findFirst({
      where: { phoneNumber: identifier, code, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_code', message: 'Invalid or expired reset code.' } },
        { status: 400 },
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'code_expired', message: 'Reset code expired. Request a new one.' } },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.resident.update({
        where: isEmail ? { email: identifier } : { phoneNumber: identifier },
        data: { passwordHash },
      }),
      db.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    track('password_reset_completed', { identifier });

    return NextResponse.json<Success>({
      ok: true,
      data: { message: 'Password reset successfully.' },
    });
  } catch (error) {
    logger.error('auth.reset_password.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

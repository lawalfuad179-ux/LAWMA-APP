import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { signInSchema, normalizePhone } from '@/lib/validators/auth';
import { track } from '@/lib/analytics';
import { createSession } from '@/lib/auth';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { residentId: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Check your phone number and password.' } },
        { status: 400 },
      );
    }

    const { phoneNumber, password } = parsed.data;
    const normalizedPhone = normalizePhone(phoneNumber);

    const resident = await db.resident.findUnique({ where: { phoneNumber: normalizedPhone } });

    if (!resident || !resident.passwordHash) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_credentials', message: 'We could not sign you in. Check your phone number and password.' } },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, resident.passwordHash);
    if (!valid) {
      track('login_failed', { phoneNumber: normalizedPhone });
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_credentials', message: 'We could not sign you in. Check your phone number and password.' } },
        { status: 401 },
      );
    }

    await createSession(resident.id);
    track('login_success', { residentId: resident.id });

    return NextResponse.json<Success>({ ok: true, data: { residentId: resident.id } });
  } catch (error) {
    logger.error('auth.signin.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

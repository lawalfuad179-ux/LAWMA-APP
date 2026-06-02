import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { signUpSchema, normalizePhone } from '@/lib/validators/auth';
import { track } from '@/lib/analytics';
import { createSession } from '@/lib/auth';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { residentId: string; phoneNumber: string } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    const { name, email, phoneNumber, password } = parsed.data;
    const normalizedPhone = normalizePhone(phoneNumber);
    const normalizedEmail = email.toLowerCase().trim();

    const existingPhone = await db.resident.findUnique({ where: { phoneNumber: normalizedPhone } });
    if (existingPhone) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'phone_exists', message: 'This phone number is already registered. Sign in instead.' } },
        { status: 409 },
      );
    }

    const existingEmail = await db.resident.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'email_exists', message: 'This email is already registered. Sign in instead.' } },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resident = await db.resident.create({
      data: {
        phoneNumber: normalizedPhone,
        email: normalizedEmail,
        name,
        passwordHash,
        onboardingVersion: 1,
      },
    });

    await createSession(resident.id);

    track('signup_completed', { residentId: resident.id });

    return NextResponse.json<Success>(
      { ok: true, data: { residentId: resident.id, phoneNumber: normalizedPhone } },
      { status: 201 },
    );
  } catch (error) {
    logger.error('auth.signup.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

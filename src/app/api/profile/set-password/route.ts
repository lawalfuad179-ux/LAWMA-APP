import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth';
import { setPasswordSchema } from '@/lib/validators/auth';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'You must be signed in.' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = setPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your password.' } },
        { status: 400 },
      );
    }

    const resident = await db.resident.findUnique({
      where: { id: session.residentId },
      select: { passwordHash: true },
    });

    if (!resident) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'not_found', message: 'Account not found.' } },
        { status: 404 },
      );
    }

    if (resident.passwordHash) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'already_set', message: 'A password is already set. Use "Change Password" instead.' } },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db.resident.update({ where: { id: session.residentId }, data: { passwordHash } });

    return NextResponse.json<Success>({ ok: true });
  } catch (error) {
    logger.error('profile.set-password.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

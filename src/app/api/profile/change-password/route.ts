import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validators/auth';

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
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: parsed.error.issues[0]?.message || 'Check your input.' } },
        { status: 400 },
      );
    }

    const resident = await db.resident.findUnique({
      where: { id: session.residentId },
      select: { passwordHash: true },
    });

    if (!resident || !resident.passwordHash) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_password', message: 'No password set. Use "Create Password" first.' } },
        { status: 409 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const valid = await bcrypt.compare(currentPassword, resident.passwordHash);
    if (!valid) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'wrong_password', message: 'Current password is incorrect.' } },
        { status: 401 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'same_password', message: 'New password must be different from your current password.' } },
        { status: 422 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.resident.update({ where: { id: session.residentId }, data: { passwordHash } });

    return NextResponse.json<Success>({ ok: true });
  } catch (error) {
    logger.error('profile.change-password.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
}

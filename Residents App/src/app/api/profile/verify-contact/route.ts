import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const schema = z.object({
  type: z.enum(['email', 'phone']),
  value: z.string().min(1),
  code: z.string().length(6).regex(/^[0-9]+$/),
});

type Success = { ok: true };
type Failure = { ok: false; error: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json<Failure>({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json<Failure>({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<Failure>({ ok: false, error: 'Invalid input.' }, { status: 400 });
  }

  const { type, value, code } = parsed.data;

  const otpRecord = await db.otpCode.findFirst({
    where: { phoneNumber: value, code, isUsed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return NextResponse.json<Failure>(
      { ok: false, error: 'Incorrect code. Please try again.' },
      { status: 400 },
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    return NextResponse.json<Failure>(
      { ok: false, error: 'Code expired. Request a new one.' },
      { status: 400 },
    );
  }

  // Check not already in use by another resident
  if (type === 'email') {
    const conflict = await db.resident.findFirst({
      where: { email: value, NOT: { id: session.residentId } },
    });
    if (conflict) {
      return NextResponse.json<Failure>({ ok: false, error: 'This email is already linked to another account.' }, { status: 409 });
    }
  } else {
    const conflict = await db.resident.findFirst({
      where: { phoneNumber: value, NOT: { id: session.residentId } },
    });
    if (conflict) {
      return NextResponse.json<Failure>({ ok: false, error: 'This phone number is already linked to another account.' }, { status: 409 });
    }
  }

  await db.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });

  await db.resident.update({
    where: { id: session.residentId },
    data: type === 'email' ? { email: value } : { phoneNumber: value },
  });

  logger.info('profile.contact.updated', { residentId: session.residentId, type });

  return NextResponse.json<Success>({ ok: true });
}

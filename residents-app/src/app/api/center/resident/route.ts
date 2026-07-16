import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { normalizePhone } from '@/lib/validators/auth';
import { DROPOFF_GUARD } from '@/lib/dropoff-guard';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const phoneSchema = z
  .string()
  .min(10, 'Enter a valid Nigerian phone number.')
  .max(15)
  .regex(/^(\+?234|0)[0-9]{10}$/, 'Enter a valid Nigerian phone number.');

const unauthorized = NextResponse.json<Failure>(
  { ok: false, error: { code: 'unauthorized', message: 'Sign in to the kiosk.' } },
  { status: 401 },
);

/**
 * Look a resident up by phone for the counter.
 *
 * Returns only what an operator needs to confirm they have the right person and
 * to see whether they are near their daily cap: name, and today's running
 * weight. Deliberately no address, email, or billing data — the kiosk is a
 * shared device on a public counter, and staff have no reason to read those.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCenterSession();
    if (!session) return unauthorized;

    const raw = req.nextUrl.searchParams.get('phone') ?? '';
    const parsed = phoneSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_phone', message: 'Enter a valid Nigerian phone number.' } },
        { status: 400 },
      );
    }

    const phoneNumber = normalizePhone(parsed.data);
    const resident = await db.resident.findUnique({
      where: { phoneNumber },
      select: { id: true, name: true },
    });

    if (!resident) {
      return NextResponse.json({
        ok: true,
        data: { found: false, phoneNumber },
      });
    }

    const dayWindow = new Date(Date.now() - DROPOFF_GUARD.DAILY_WINDOW_MS);
    const todays = await db.dropOff.aggregate({
      where: {
        residentId: resident.id,
        status: { in: ['CONFIRMED', 'FLAGGED'] },
        createdAt: { gte: dayWindow },
      },
      _sum: { weightGrams: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        found: true,
        phoneNumber,
        resident: { id: resident.id, name: resident.name },
        today: {
          weightGrams: todays._sum.weightGrams ?? 0,
          capGrams: DROPOFF_GUARD.DAILY_KG_CAP * 1000,
        },
      },
    });
  } catch (error) {
    logger.error('center.resident.lookup_failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

const registerSchema = z.object({
  phoneNumber: phoneSchema,
  name: z.string().min(2, 'Enter a name.').max(100),
});

/**
 * Walk-up registration at the counter.
 *
 * Creates a passwordless Resident keyed on phone number. The person can later
 * claim the same account from the app via OTP and find their credit already
 * waiting — which is what turns a collection centre into an acquisition channel
 * rather than a dead-end cash desk.
 *
 * Idempotent: if the phone already exists we return that resident instead of
 * failing, because at a counter the operator's retry is a re-tap, not a bug.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCenterSession();
    if (!session) return unauthorized;

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        {
          ok: false,
          error: {
            code: 'invalid_input',
            message: parsed.error.issues[0]?.message ?? 'Check the details and try again.',
          },
        },
        { status: 400 },
      );
    }

    const phoneNumber = normalizePhone(parsed.data.phoneNumber);
    const name = parsed.data.name.trim();

    const existing = await db.resident.findUnique({
      where: { phoneNumber },
      select: { id: true, name: true },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        data: { resident: existing, created: false },
      });
    }

    const resident = await db.resident.create({
      data: { phoneNumber, name },
      select: { id: true, name: true },
    });

    logger.info('center.resident.registered', {
      residentId: resident.id,
      centerId: session.centerId,
      operatorId: session.operatorId,
    });

    return NextResponse.json({
      ok: true,
      data: { resident, created: true },
    });
  } catch (error) {
    logger.error('center.resident.register_failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

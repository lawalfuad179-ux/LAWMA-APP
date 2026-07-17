import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const tricycleSelect = {
  id: true,
  rfidTag: true,
  plateNumber: true,
  operatorName: true,
  zone: true,
  walletBalanceKobo: true,
} as const;

/** Active fleet — feeds the kiosk's "approaching tricycles" simulator cards. */
export async function GET() {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the station.' } },
        { status: 401 },
      );
    }

    const tricycles = await db.tricycle.findMany({
      where: { isActive: true },
      orderBy: { operatorName: 'asc' },
      select: tricycleSelect,
    });

    return NextResponse.json({ ok: true, data: { tricycles } });
  } catch (error) {
    logger.error('station.fleet.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

const detectSchema = z.object({
  rfidTag: z.string().trim().min(3).max(32),
});

/** Resolve a tag read (typed or tapped) to a tricycle. */
export async function POST(req: NextRequest) {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the station.' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = detectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Enter the RFID tag on the tricycle.' } },
        { status: 400 },
      );
    }

    const tricycle = await db.tricycle.findFirst({
      where: { rfidTag: parsed.data.rfidTag.toUpperCase(), isActive: true },
      select: tricycleSelect,
    });

    if (!tricycle) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_tricycle', message: 'No registered tricycle carries that tag.' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: { tricycle } });
  } catch (error) {
    logger.error('station.detect.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

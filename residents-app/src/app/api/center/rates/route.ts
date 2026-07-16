import { NextResponse } from 'next/server';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

/** Active buy-back rates, for the kiosk's material buttons. */
export async function GET() {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the kiosk.' } },
        { status: 401 },
      );
    }

    const rates = await db.materialRate.findMany({
      where: { isActive: true },
      orderBy: { koboPerKg: 'desc' },
      select: { material: true, koboPerKg: true },
    });

    return NextResponse.json({ ok: true, data: { rates } });
  } catch (error) {
    logger.error('center.rates.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';

import { getCenterSession, logoutOperator } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

/** Current operator + this shift's running totals, for the kiosk header. */
export async function GET() {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the kiosk.' } },
        { status: 401 },
      );
    }

    // "Today" = midnight local. Operators think in shifts, not rolling windows.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totals = await db.dropOff.aggregate({
      where: {
        operatorId: session.operatorId,
        status: { in: ['CONFIRMED', 'FLAGGED'] },
        createdAt: { gte: startOfDay },
      },
      _sum: { weightGrams: true, amountKobo: true },
      _count: { _all: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        operatorName: session.operatorName,
        centerName: session.centerName,
        today: {
          dropOffs: totals._count._all,
          weightGrams: totals._sum.weightGrams ?? 0,
          amountKobo: totals._sum.amountKobo ?? 0,
        },
      },
    });
  } catch (error) {
    logger.error('center.session.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  await logoutOperator();
  return NextResponse.json({ ok: true, data: null });
}

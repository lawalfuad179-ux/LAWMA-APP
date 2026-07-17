import { NextResponse } from 'next/server';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

/**
 * Today's bridge passes for this station, newest first. Station-scoped (not
 * operator-scoped like the centre's history): the bridge log is the station's
 * throughput record, and it's what fee revenue reconciles against.
 */
export async function GET() {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the station.' } },
        { status: 401 },
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const events = await db.weighEvent.findMany({
      where: { stationId: session.centerId, createdAt: { gte: startOfDay } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        receiptCode: true,
        grossWeightGrams: true,
        feeKobo: true,
        balanceAfterKobo: true,
        status: true,
        createdAt: true,
        tricycle: { select: { rfidTag: true, plateNumber: true, operatorName: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          receiptCode: e.receiptCode,
          rfidTag: e.tricycle.rfidTag,
          plateNumber: e.tricycle.plateNumber,
          operatorName: e.tricycle.operatorName,
          grossWeightGrams: e.grossWeightGrams,
          feeKobo: e.feeKobo,
          balanceAfterKobo: e.balanceAfterKobo,
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error('station.history.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

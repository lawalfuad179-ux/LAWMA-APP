import { NextResponse } from 'next/server';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

/**
 * This operator's weigh-ins for the current shift (midnight-local onward),
 * newest first. Scoped to the operator, not the centre — the history view is
 * "what have I recorded", which is also what a supervisor reconciles cash
 * against at handover.
 */
export async function GET() {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the kiosk.' } },
        { status: 401 },
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const visits = await db.dropOff.findMany({
      where: { operatorId: session.operatorId, createdAt: { gte: startOfDay } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        receiptCode: true,
        totalWeightGrams: true,
        totalAmountKobo: true,
        payoutMethod: true,
        status: true,
        createdAt: true,
        resident: { select: { name: true } },
        lines: { select: { material: true, weightGrams: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        visits: visits.map((v) => ({
          id: v.id,
          receiptCode: v.receiptCode,
          residentName: v.resident.name,
          totalWeightGrams: v.totalWeightGrams,
          totalAmountKobo: v.totalAmountKobo,
          payoutMethod: v.payoutMethod,
          status: v.status,
          createdAt: v.createdAt.toISOString(),
          summary: v.lines
            .map((l) => `${titleCase(l.material)} ${(l.weightGrams / 1000).toFixed(1)}kg`)
            .join(' · '),
        })),
      },
    });
  } catch (error) {
    logger.error('center.history.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

function titleCase(m: string): string {
  return m.charAt(0) + m.slice(1).toLowerCase();
}

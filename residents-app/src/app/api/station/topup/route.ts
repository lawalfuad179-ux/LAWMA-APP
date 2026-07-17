import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const schema = z.object({
  tricycleId: z.string().uuid(),
  // Cash handed to the attendant, in kobo. Capped at ₦100,000 per top-up.
  amountKobo: z.number().int().positive().max(10_000_000),
});

/** Credit a tricycle wallet — cash over the counter, recorded to the ledger. */
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Check the top-up amount.' } },
        { status: 400 },
      );
    }
    const { tricycleId, amountKobo } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.tricycle.update({
        where: { id: tricycleId },
        data: { walletBalanceKobo: { increment: amountKobo } },
        select: { walletBalanceKobo: true, operatorName: true, rfidTag: true },
      });

      await tx.tricycleWalletTransaction.create({
        data: {
          tricycleId,
          type: 'TOPUP',
          amountKobo,
          balanceAfterKobo: updated.walletBalanceKobo,
          operatorId: session.operatorId,
          note: `Cash top-up at ${session.centerName}`,
        },
      });

      return updated;
    });

    logger.info('station.topup.recorded', {
      stationId: session.centerId,
      operatorId: session.operatorId,
      tricycleId,
      amountKobo,
    });

    return NextResponse.json({
      ok: true,
      data: {
        operatorName: result.operatorName,
        rfidTag: result.rfidTag,
        amountKobo,
        balanceAfterKobo: result.walletBalanceKobo,
      },
    });
  } catch (error) {
    logger.error('station.topup.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

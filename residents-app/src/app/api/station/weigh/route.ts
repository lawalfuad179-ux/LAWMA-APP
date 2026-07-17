import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { buildStationReceiptCode, computeTippingFeeKobo, evaluateWeigh } from '@/lib/weighbridge';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const schema = z.object({
  tricycleId: z.string().uuid(),
  // Whole grams — the kiosk converts the settled kg reading before sending,
  // so money never rides on a float.
  weightGrams: z.number().int().positive().max(1_000_000),
});

/**
 * Record a bridge pass and dock the tipping fee.
 *
 * One transaction: the WeighEvent, the wallet decrement and the ledger row
 * land together or not at all. The wallet MAY go negative — a loaded tricycle
 * is never turned away (see weighbridge.ts) — but the event is then
 * FLAGGED_NEGATIVE and the debt is visible until the next top-up.
 */
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
        { ok: false, error: { code: 'invalid_input', message: 'Check the weight reading.' } },
        { status: 400 },
      );
    }
    const { tricycleId, weightGrams } = parsed.data;

    const [tricycle, rate] = await Promise.all([
      db.tricycle.findFirst({
        where: { id: tricycleId, isActive: true },
        select: { id: true, rfidTag: true, plateNumber: true, operatorName: true, walletBalanceKobo: true },
      }),
      db.tippingRate.findFirst({ where: { isActive: true } }),
    ]);

    if (!tricycle) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_tricycle', message: 'Tricycle not found. Detect it again.' } },
        { status: 404 },
      );
    }
    if (!rate) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_rate', message: 'No active tipping rate is configured.' } },
        { status: 409 },
      );
    }

    // Fee priced server-side at the rate in force right now, and that rate is
    // copied onto the event — a later reprice never rewrites what was charged.
    const feeKobo = computeTippingFeeKobo(weightGrams, rate.koboPerKg);
    const verdict = await evaluateWeigh({
      tricycleId,
      weightGrams,
      feeKobo,
      walletBalanceKobo: tricycle.walletBalanceKobo,
    });

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.tricycle.update({
        where: { id: tricycleId },
        data: { walletBalanceKobo: { decrement: feeKobo } },
        select: { walletBalanceKobo: true },
      });

      const event = await tx.weighEvent.create({
        data: {
          tricycleId,
          stationId: session.centerId,
          operatorId: session.operatorId,
          grossWeightGrams: weightGrams,
          rateKoboPerKg: rate.koboPerKg,
          feeKobo,
          balanceAfterKobo: updated.walletBalanceKobo,
          status: verdict.negative ? 'FLAGGED_NEGATIVE' : 'SETTLED',
          flagReason: verdict.reason,
          receiptCode: buildStationReceiptCode(session.centerName),
        },
      });

      await tx.tricycleWalletTransaction.create({
        data: {
          tricycleId,
          type: 'TIPPING_FEE',
          amountKobo: -feeKobo,
          balanceAfterKobo: updated.walletBalanceKobo,
          weighEventId: event.id,
          operatorId: session.operatorId,
        },
      });

      return { event, balanceAfterKobo: updated.walletBalanceKobo };
    });

    logger.info('station.weigh.recorded', {
      weighEventId: result.event.id,
      stationId: session.centerId,
      operatorId: session.operatorId,
      tricycleId,
      weightGrams,
      feeKobo,
      negative: verdict.negative,
      flagged: verdict.flagged,
    });

    return NextResponse.json({
      ok: true,
      data: {
        receiptCode: result.event.receiptCode,
        tricycle: {
          rfidTag: tricycle.rfidTag,
          plateNumber: tricycle.plateNumber,
          operatorName: tricycle.operatorName,
        },
        grossWeightGrams: weightGrams,
        rateKoboPerKg: rate.koboPerKg,
        feeKobo,
        balanceBeforeKobo: tricycle.walletBalanceKobo,
        balanceAfterKobo: result.balanceAfterKobo,
        status: result.event.status,
        flagged: verdict.flagged,
        flagReason: verdict.reason,
      },
    });
  } catch (error) {
    logger.error('station.weigh.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

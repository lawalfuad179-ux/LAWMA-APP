import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { buildReceiptCode, computeAmountKobo, evaluateDropOff } from '@/lib/dropoff-guard';
import { koboToPoints } from '@/lib/rewards';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const schema = z.object({
  residentId: z.string().uuid(),
  material: z.enum(['PLASTIC', 'PAPER', 'CARDBOARD', 'METAL', 'GLASS']),
  // Grams, integer. The kiosk converts the operator's kg entry before sending,
  // so money never depends on a float round-trip.
  weightGrams: z.number().int().positive().max(1_000_000),
});

/**
 * Record a counter weigh-in and credit the resident.
 *
 * The whole thing is one transaction: the DropOff row, the RewardAccount
 * increment, and the PointTransaction ledger entry land together or not at all.
 * A half-written weigh-in is a resident who handed over material and got
 * nothing, which is the one failure this flow must never produce.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCenterSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Sign in to the kiosk.' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Check the material and weight.' } },
        { status: 400 },
      );
    }
    const { residentId, material, weightGrams } = parsed.data;

    const [resident, rate] = await Promise.all([
      db.resident.findUnique({ where: { id: residentId }, select: { id: true, name: true } }),
      db.materialRate.findUnique({ where: { material } }),
    ]);

    if (!resident) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_resident', message: 'Resident not found. Look them up again.' } },
        { status: 404 },
      );
    }
    if (!rate || !rate.isActive) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_rate', message: `No active buy-back rate for ${material}.` } },
        { status: 409 },
      );
    }

    const amountKobo = computeAmountKobo(weightGrams, rate.koboPerKg);
    const pointsAwarded = koboToPoints(amountKobo);

    // Flags, never blocks — see the design note in dropoff-guard.ts.
    const verdict = await evaluateDropOff({ residentId, weightGrams });

    const result = await db.$transaction(async (tx) => {
      const dropOff = await tx.dropOff.create({
        data: {
          centerId: session.centerId,
          operatorId: session.operatorId,
          residentId,
          material,
          weightGrams,
          rateKoboPerKg: rate.koboPerKg,
          amountKobo,
          pointsAwarded,
          status: verdict.flagged ? 'FLAGGED' : 'CONFIRMED',
          flagReason: verdict.reason,
          receiptCode: buildReceiptCode(session.centerName),
        },
      });

      // Zero-value weigh-ins (a few grams) still get a DropOff row for the
      // audit trail, but must not write a 0-point ledger entry — that would
      // litter the resident's history with meaningless lines.
      let newBalance: number;
      if (pointsAwarded > 0) {
        const account = await tx.rewardAccount.upsert({
          where: { residentId },
          update: {
            balance: { increment: pointsAwarded },
            totalEarned: { increment: pointsAwarded },
          },
          create: {
            residentId,
            balance: pointsAwarded,
            totalEarned: pointsAwarded,
            totalRedeemed: 0,
          },
        });
        newBalance = account.balance;

        await tx.pointTransaction.create({
          data: {
            residentId,
            amount: pointsAwarded,
            type: 'EARNED_CENTER_DROPOFF',
            description: `${(weightGrams / 1000).toFixed(1)}kg ${material.toLowerCase()} at ${session.centerName}`,
            dropOffId: dropOff.id,
          },
        });
      } else {
        const account = await tx.rewardAccount.findUnique({
          where: { residentId },
          select: { balance: true },
        });
        newBalance = account?.balance ?? 0;
      }

      return { dropOff, newBalance };
    });

    logger.info('center.dropoff.recorded', {
      dropOffId: result.dropOff.id,
      centerId: session.centerId,
      operatorId: session.operatorId,
      residentId,
      material,
      weightGrams,
      amountKobo,
      flagged: verdict.flagged,
    });

    return NextResponse.json({
      ok: true,
      data: {
        receiptCode: result.dropOff.receiptCode,
        residentName: resident.name,
        material,
        weightGrams,
        rateKoboPerKg: rate.koboPerKg,
        amountKobo,
        pointsAwarded,
        newBalance: result.newBalance,
        flagged: verdict.flagged,
        flagReason: verdict.reason,
      },
    });
  } catch (error) {
    logger.error('center.dropoff.failed', { error: String(error) });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } },
      { status: 500 },
    );
  }
}

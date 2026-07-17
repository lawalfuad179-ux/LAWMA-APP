import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCenterSession } from '@/lib/center-auth';
import { buildReceiptCode, computeAmountKobo, evaluateDropOff } from '@/lib/dropoff-guard';
import { koboToPoints } from '@/lib/rewards';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

const MATERIALS = ['PLASTIC', 'PAPER', 'CARDBOARD', 'METAL', 'GLASS'] as const;

const schema = z.object({
  residentId: z.string().uuid(),
  // One entry per material. The kiosk converts the operator's kg entry to whole
  // grams before sending, so money never depends on a float round-trip.
  lines: z
    .array(
      z.object({
        material: z.enum(MATERIALS),
        weightGrams: z.number().int().positive().max(1_000_000),
      }),
    )
    .min(1, 'Weigh at least one material.')
    .max(MATERIALS.length)
    .refine(
      (lines) => new Set(lines.map((l) => l.material)).size === lines.length,
      'Each material may only appear once — combine the weights.',
    ),
});

/**
 * Record a counter VISIT and credit the resident.
 *
 * A visit is one person, one sack, one handover, one payment — with a line per
 * material. The whole thing is a single transaction: the visit, its lines, the
 * RewardAccount increment and the ledger entry land together or not at all. A
 * half-written visit is a resident who handed over material and got nothing,
 * which is the one failure this flow must never produce.
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
        {
          ok: false,
          error: {
            code: 'invalid_input',
            message: parsed.error.issues[0]?.message ?? 'Check the materials and weights.',
          },
        },
        { status: 400 },
      );
    }
    const { residentId, lines } = parsed.data;

    const [resident, rates] = await Promise.all([
      db.resident.findUnique({ where: { id: residentId }, select: { id: true, name: true } }),
      db.materialRate.findMany({
        where: { material: { in: lines.map((l) => l.material) }, isActive: true },
      }),
    ]);

    if (!resident) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_resident', message: 'Resident not found. Look them up again.' } },
        { status: 404 },
      );
    }

    const rateFor = new Map(rates.map((r) => [r.material, r.koboPerKg]));
    const missing = lines.find((l) => !rateFor.has(l.material));
    if (missing) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'no_rate', message: `No active buy-back rate for ${missing.material}.` } },
        { status: 409 },
      );
    }

    // Price each line at the rate in force right now, then copy that rate onto
    // the row — a later reprice must never rewrite what someone was paid.
    const priced = lines.map((l) => {
      const rateKoboPerKg = rateFor.get(l.material)!;
      return {
        material: l.material,
        weightGrams: l.weightGrams,
        rateKoboPerKg,
        amountKobo: computeAmountKobo(l.weightGrams, rateKoboPerKg),
      };
    });

    const totalWeightGrams = priced.reduce((s, l) => s + l.weightGrams, 0);
    const totalAmountKobo = priced.reduce((s, l) => s + l.amountKobo, 0);
    const pointsAwarded = koboToPoints(totalAmountKobo);

    // Evaluated against the visit total. Flags, never blocks — see the design
    // note in dropoff-guard.ts.
    const verdict = await evaluateDropOff({ residentId, weightGrams: totalWeightGrams });

    const result = await db.$transaction(async (tx) => {
      const dropOff = await tx.dropOff.create({
        data: {
          centerId: session.centerId,
          operatorId: session.operatorId,
          residentId,
          totalWeightGrams,
          totalAmountKobo,
          pointsAwarded,
          status: verdict.flagged ? 'FLAGGED' : 'CONFIRMED',
          flagReason: verdict.reason,
          receiptCode: buildReceiptCode(session.centerName),
          lines: { create: priced },
        },
        include: { lines: true },
      });

      // Zero-value visits (a few grams) still get a row for the audit trail, but
      // must not write a 0-point ledger entry — that would litter the resident's
      // history with meaningless lines.
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

        // One ledger line per VISIT, not per material — the resident made one
        // trip and should see one entry.
        const summary = priced
          .map((l) => `${(l.weightGrams / 1000).toFixed(1)}kg ${l.material.toLowerCase()}`)
          .join(', ');
        await tx.pointTransaction.create({
          data: {
            residentId,
            amount: pointsAwarded,
            type: 'EARNED_CENTER_DROPOFF',
            description: `${summary} at ${session.centerName}`,
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
      lineCount: priced.length,
      totalWeightGrams,
      totalAmountKobo,
      flagged: verdict.flagged,
    });

    return NextResponse.json({
      ok: true,
      data: {
        receiptCode: result.dropOff.receiptCode,
        residentName: resident.name,
        lines: priced,
        totalWeightGrams,
        totalAmountKobo,
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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { pointsToKobo, maxRedeemablePoints, MIN_REDEEM_POINTS } from '@/lib/rewards';
import { logger } from '@/lib/logger';

const schema = z.object({
  points: z.number().int().min(MIN_REDEEM_POINTS),
  billId: z.string().uuid(),
});

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { pointsRedeemed: number; discountKobo: number; newBalance: number } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: `Minimum redemption is ${MIN_REDEEM_POINTS} points.` } }, { status: 400 });
    }

    const { points, billId } = parsed.data;

    const [rewardAccount, bill] = await Promise.all([
      db.rewardAccount.findUnique({ where: { residentId: session.residentId } }),
      db.bill.findFirst({ where: { id: billId, residentId: session.residentId, status: 'PENDING' } }),
    ]);

    if (!rewardAccount || rewardAccount.balance < points) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'insufficient_points', message: 'You do not have enough points.' } }, { status: 400 });
    }

    if (!bill) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'bill_not_found', message: 'Pending bill not found.' } }, { status: 404 });
    }

    const maxPts = maxRedeemablePoints(bill.amountKobo, bill.discountKobo);
    if (points > maxPts) {
      return NextResponse.json<Failure>({
        ok: false,
        error: { code: 'exceeds_limit', message: `You can redeem at most ${maxPts} points on this bill (50% cap).` },
      }, { status: 400 });
    }

    const discountKobo = pointsToKobo(points);

    const updatedAccount = await db.$transaction(async (tx) => {
      await tx.bill.update({
        where: { id: billId },
        data: { discountKobo: { increment: discountKobo } },
      });

      const acct = await tx.rewardAccount.update({
        where: { residentId: session.residentId },
        data: {
          balance: { decrement: points },
          totalRedeemed: { increment: points },
        },
      });

      await tx.pointTransaction.create({
        data: {
          residentId: session.residentId,
          amount: -points,
          type: 'REDEEMED_BILL_DISCOUNT',
          description: `₦${(discountKobo / 100).toLocaleString()} discount applied to bill`,
          billId,
        },
      });

      await tx.notification.create({
        data: {
          residentId: session.residentId,
          title: `₦${(discountKobo / 100).toLocaleString()} Bill Discount Applied`,
          body: `You redeemed ${points} points for a ₦${(discountKobo / 100).toLocaleString()} discount on your waste management bill.`,
          type: 'PAYMENT_CONFIRMATION',
          referenceId: billId,
        },
      });

      return acct;
    });

    logger.info('rewards.redeemed', { residentId: session.residentId, points, billId, discountKobo });

    return NextResponse.json<Success>({
      ok: true,
      data: { pointsRedeemed: points, discountKobo, newBalance: updatedAccount.balance },
    });
  } catch (error) {
    logger.error('rewards.redeem.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

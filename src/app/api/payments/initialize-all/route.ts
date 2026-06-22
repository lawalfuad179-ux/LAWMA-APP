import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createPaymentLink } from '@/lib/flutterwave';
import { applyRedemption, computeAutoRedeem } from '@/lib/rewards';

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { checkoutUrl: string } };

export async function POST(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const outstandingBills = await db.bill.findMany({
      where: { residentId: session.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    });

    if (outstandingBills.length === 0) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'no_outstanding', message: 'No outstanding bills to pay.' } }, { status: 400 });
    }

    const billIds = outstandingBills.map((b) => b.id);
    const firstBill = outstandingBills[0];

    const txRef = `lawma_bulk_${session.residentId.slice(0, 8)}_${outstandingBills.length}_${Date.now()}`;

    // Apply reward credit across the bills in due-date order, capping each at
    // its 50% headroom. Whatever's left after the first bill carries into the
    // next, and so on. Net total = sum of (bill.amountKobo - bill.discountKobo)
    // after redemption — that's what we charge the gateway.
    const { payment, netKobo } = await db.$transaction(async (tx: any) => {
      const account = await tx.rewardAccount.findUnique({
        where: { residentId: session.residentId },
        select: { balance: true },
      });

      let pointsLeft = account?.balance ?? 0;
      let netTotal = 0;

      for (const b of outstandingBills) {
        const pts = computeAutoRedeem(b.amountKobo, b.discountKobo, pointsLeft);
        let extraDiscountKobo = 0;
        if (pts > 0) {
          const { discountKobo } = await applyRedemption(tx, {
            residentId: session.residentId,
            billId: b.id,
            points: pts,
          });
          extraDiscountKobo = discountKobo;
          pointsLeft -= pts;
        }
        netTotal += b.amountKobo - b.discountKobo - extraDiscountKobo;
      }

      const created = await tx.payment.create({
        data: {
          billId: firstBill.id,
          residentId: session.residentId,
          amountKobo: netTotal,
          currency: 'NGN',
          status: 'PENDING',
          txRef,
        },
      });

      return { payment: created, netKobo: netTotal };
    });

    const resident = await db.resident.findUnique({ where: { id: session.residentId } });
    if (!resident) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Resident not found.' } }, { status: 404 });
    }

    const result = await createPaymentLink({
      txRef,
      amountKobo: netKobo,
      customerPhone: resident.phoneNumber ?? '',
      customerName: resident.name || resident.phoneNumber || resident.email || 'Customer',
      customerEmail: resident.email ?? undefined,
      billId: firstBill.id,
      residentId: session.residentId,
      paymentId: payment.id,
      meta: { bill_ids: billIds.join(',') },
    });

    if (!result.ok) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'payment_gateway_error', message: result.error } }, { status: 502 });
    }

    logger.info('payment.initialize_all', { billCount: outstandingBills.length, netKobo, txRef });

    return NextResponse.json<Success>({ ok: true, data: { checkoutUrl: result.checkoutUrl } });
  } catch (error) {
    logger.error('payments.initialize_all.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

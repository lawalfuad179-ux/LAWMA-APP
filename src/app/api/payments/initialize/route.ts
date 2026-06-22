import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createPaymentLink } from '@/lib/flutterwave';
import { applyRedemption, computeAutoRedeem } from '@/lib/rewards';

const initSchema = z.object({
  billId: z.string().uuid(),
});

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { checkoutUrl: string } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Invalid bill reference.' } }, { status: 400 });
    }

    const { billId } = parsed.data;

    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Bill not found.' } }, { status: 404 });
    }

    if (bill.status === 'PAID') {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'already_paid', message: 'This bill is already paid.' } }, { status: 400 });
    }

    const resident = await db.resident.findUnique({ where: { id: session.residentId } });
    if (!resident) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Resident not found.' } }, { status: 404 });
    }

    const txRef = `lawma_bill_${billId}_${Date.now()}`;

    // Auto-apply any reward credit the resident has accumulated. Caps at 50%
    // of the bill's undiscounted remainder. Runs inside a transaction with
    // the new Payment row so we charge the gateway the post-discount amount
    // and there's no window where the discount is half-applied.
    const { payment, netKobo } = await db.$transaction(async (tx: any) => {
      const account = await tx.rewardAccount.findUnique({
        where: { residentId: session.residentId },
        select: { balance: true },
      });

      const points = computeAutoRedeem(bill.amountKobo, bill.discountKobo, account?.balance ?? 0);
      let netDiscountKobo = bill.discountKobo;
      if (points > 0) {
        const { discountKobo } = await applyRedemption(tx, {
          residentId: session.residentId,
          billId: bill.id,
          points,
        });
        netDiscountKobo = bill.discountKobo + discountKobo;
      }

      const net = bill.amountKobo - netDiscountKobo;

      const created = await tx.payment.create({
        data: {
          billId: bill.id,
          residentId: session.residentId,
          amountKobo: net,
          currency: 'NGN',
          status: 'PENDING',
          txRef,
        },
      });

      return { payment: created, netKobo: net };
    });

    const result = await createPaymentLink({
      txRef,
      amountKobo: netKobo,
      customerPhone: resident.phoneNumber ?? '',
      customerName: resident.name || resident.phoneNumber || resident.email || 'Customer',
      customerEmail: resident.email ?? undefined,
      billId: bill.id,
      residentId: session.residentId,
      paymentId: payment.id,
    });

    if (!result.ok) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'payment_gateway_error', message: result.error } }, { status: 502 });
    }

    logger.info('payment.initialized', { billId, txRef });

    return NextResponse.json<Success>({ ok: true, data: { checkoutUrl: result.checkoutUrl } });
  } catch (error) {
    logger.error('payments.initialize.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

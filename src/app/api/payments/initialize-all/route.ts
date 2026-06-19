import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createPaymentLink } from '@/lib/flutterwave';

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

    const totalKobo = outstandingBills.reduce((sum, b) => sum + b.amountKobo, 0);
    const billIds = outstandingBills.map((b) => b.id);
    const firstBill = outstandingBills[0];

    const txRef = `lawma_bulk_${session.residentId.slice(0, 8)}_${outstandingBills.length}_${Date.now()}`;

    const payment = await db.payment.create({
      data: {
        billId: firstBill.id,
        residentId: session.residentId,
        amountKobo: totalKobo,
        currency: 'NGN',
        status: 'PENDING',
        txRef,
      },
    });

    const resident = await db.resident.findUnique({ where: { id: session.residentId } });
    if (!resident) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Resident not found.' } }, { status: 404 });
    }

    const result = await createPaymentLink({
      txRef,
      amountKobo: totalKobo,
      customerPhone: resident.phoneNumber ?? resident.email ?? '',
      customerName: resident.name || resident.phoneNumber || resident.email || 'Customer',
      customerEmail: undefined,
      billId: firstBill.id,
      residentId: session.residentId,
      paymentId: payment.id,
      meta: { bill_ids: billIds.join(',') },
    });

    if (!result.ok) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'payment_gateway_error', message: result.error } }, { status: 502 });
    }

    logger.info('payment.initialize_all', { billCount: outstandingBills.length, totalKobo, txRef });

    return NextResponse.json<Success>({ ok: true, data: { checkoutUrl: result.checkoutUrl } });
  } catch (error) {
    logger.error('payments.initialize_all.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

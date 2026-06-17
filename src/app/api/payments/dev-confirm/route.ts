import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const confirmSchema = z.object({
  paymentId: z.string().uuid(),
});

type Failure = { ok: false; error: string };
type Success = { ok: true; data: { paymentId: string; status: string } };

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json<Failure>({ ok: false, error: 'Only available in development.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: 'Invalid payment ID.' }, { status: 400 });
    }

    const { paymentId } = parsed.data;

    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return NextResponse.json<Failure>({ ok: false, error: 'Payment not found.' }, { status: 404 });
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json<Success>({ ok: true, data: { paymentId, status: payment.status } });
    }

    const isBulk = payment.txRef.startsWith('lawma_bulk_');

    await db.$transaction(async (prisma: any) => {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESSFUL', paidAt: new Date() },
      });

      if (isBulk) {
        await prisma.bill.updateMany({
          where: { residentId: payment.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
          data: { status: 'PAID' },
        });
      } else {
        await prisma.bill.update({
          where: { id: payment.billId },
          data: { status: 'PAID' },
        });
      }
    });

    logger.info('payments.dev_confirm', { paymentId, txRef: payment.txRef, isBulk });

    return NextResponse.json<Success>({ ok: true, data: { paymentId, status: 'SUCCESSFUL' } });
  } catch (error) {
    logger.error('payments.dev_confirm.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: 'Something went wrong.' }, { status: 500 });
  }
}

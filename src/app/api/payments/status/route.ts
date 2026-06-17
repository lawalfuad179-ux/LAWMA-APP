import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const txRef = req.nextUrl.searchParams.get('tx_ref');
    if (!txRef) {
      return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({ where: { txRef } });

    if (!payment) {
      return NextResponse.json({ status: 'NOT_FOUND' });
    }

    // Already resolved — return immediately
    if (payment.status !== 'PENDING') {
      return NextResponse.json({ status: payment.status });
    }

    // Payment still PENDING — query Flutterwave directly.
    // This handles the case where the webhook hasn't fired yet (e.g. local dev).
    try {
      const fwRes = await fetch(
        `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
        {
          headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        }
      );

      if (fwRes.ok) {
        const fwBody = await fwRes.json();
        const tx = fwBody.data?.[0];

        if (
          tx &&
          tx.status === 'successful' &&
          tx.amount === payment.amountKobo / 100 &&
          tx.currency === payment.currency &&
          tx.tx_ref === payment.txRef
        ) {
          await db.$transaction(async (prisma: any) => {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCESSFUL',
                gatewayReference: tx.flw_ref ?? null,
                paidAt: new Date(),
              },
            });
            await prisma.bill.update({
              where: { id: payment.billId },
              data: { status: 'PAID' },
            });
          });

          logger.info('payments.status.direct_verify_success', { txRef });
          return NextResponse.json({ status: 'SUCCESSFUL' });
        }
      }
    } catch (fwError) {
      // Non-fatal — fall through and return PENDING so the page keeps polling
      logger.warn('payments.status.direct_verify_error', { txRef, error: String(fwError) });
    }

    return NextResponse.json({ status: payment.status });
  } catch (error) {
    logger.error('payments.status.failed', { error: String(error) });
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

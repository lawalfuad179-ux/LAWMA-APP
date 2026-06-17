import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    if (!txRef) {
      return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({ where: { txRef } });

    if (!payment) {
      return NextResponse.json({ status: 'NOT_FOUND' });
    }

    // Already resolved
    if (payment.status !== 'PENDING') {
      return NextResponse.json({ status: payment.status });
    }

    // Use the numeric transaction_id from the Flutterwave redirect for the
    // definitive verify endpoint. Fall back to the tx_ref list query if absent.
    try {
      let txData: Record<string, unknown> | null = null;

      if (transactionId) {
        // Preferred path: direct verify by transaction ID
        const verifyRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
          { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );
        if (verifyRes.ok) {
          const body = await verifyRes.json();
          if (body.status === 'success' && body.data) {
            txData = body.data;
          }
        }
      } else {
        // Fallback: query by tx_ref
        const listRes = await fetch(
          `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
          { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );
        if (listRes.ok) {
          const body = await listRes.json();
          txData = body.data?.[0] ?? null;
        }
      }

      if (
        txData &&
        txData.status === 'successful' &&
        (txData.amount as number) === payment.amountKobo / 100 &&
        txData.currency === 'NGN' &&
        txData.tx_ref === payment.txRef
      ) {
        await db.$transaction(async (prisma: any) => {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESSFUL',
              gatewayReference: (txData!.flw_ref as string) ?? null,
              paidAt: new Date(),
            },
          });
          await prisma.bill.update({
            where: { id: payment.billId },
            data: { status: 'PAID' },
          });
        });

        logger.info('payments.status.verified', { txRef, transactionId });
        return NextResponse.json({ status: 'SUCCESSFUL' });
      }
    } catch (fwError) {
      logger.warn('payments.status.fw_check_error', { txRef, error: String(fwError) });
    }

    return NextResponse.json({ status: payment.status });
  } catch (error) {
    logger.error('payments.status.failed', { error: String(error) });
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

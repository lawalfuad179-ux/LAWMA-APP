import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type FlutterwaveWebhookBody = {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash');
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!signature || signature !== secretHash) {
      logger.warn('webhook.flutterwave.unauthorized_signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = (await req.json()) as FlutterwaveWebhookBody;
    const { tx_ref, amount, currency, status, id: transactionId } = payload.data;

    if (payload.event !== 'charge.completed') {
      return NextResponse.json({ ok: true, message: 'Event ignored' });
    }

    const payment = await db.payment.findUnique({ where: { txRef: tx_ref } });
    if (!payment) {
      logger.warn('webhook.flutterwave.payment_not_found', { tx_ref });
      return NextResponse.json({ ok: true, message: 'Payment record not found' });
    }

    if (payment.status === 'SUCCESSFUL') {
      return NextResponse.json({ ok: true, message: 'Payment already processed' });
    }

    // Verify with Flutterwave API
    const verifyUrl = `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    });

    if (!verifyRes.ok) {
      logger.error('webhook.flutterwave.verification_api_failed', { transactionId });
      return new Response('Verification API failed', { status: 500 });
    }

    const verifyData = await verifyRes.json();

    if (
      verifyData.status !== 'success' ||
      verifyData.data.status !== 'successful' ||
      verifyData.data.amount !== payment.amountKobo / 100 ||
      verifyData.data.currency !== payment.currency ||
      verifyData.data.tx_ref !== payment.txRef
    ) {
      logger.warn('webhook.flutterwave.validation_checks_failed', { tx_ref });
      return NextResponse.json({ ok: true, message: 'Validation checks failed' });
    }

    // Update payment and bill in a transaction
    try {
      await db.$transaction(async (tx: any) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESSFUL', gatewayReference: verifyData.data.flw_ref, paidAt: new Date() },
        });
        await tx.bill.update({
          where: { id: payment.billId },
          data: { status: 'PAID' },
        });
      });

      logger.info('webhook.flutterwave.success', { tx_ref, billId: payment.billId });
      return NextResponse.json({ ok: true, message: 'Payment completed successfully' });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        logger.info('webhook.flutterwave.duplicate_prevented', { tx_ref });
        return NextResponse.json({ ok: true, message: 'Duplicate payment processing skipped' });
      }
      throw dbError;
    }
  } catch (error) {
    logger.error('webhook.flutterwave.failed', { error: String(error) });
    return NextResponse.json({ ok: false, error: { code: 'server_error', message: 'Internal server error' } }, { status: 500 });
  }
}

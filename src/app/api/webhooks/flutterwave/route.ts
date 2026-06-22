import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { POINTS_PER_BILL_PAYMENT } from '@/lib/rewards';

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

    const payload = (await req.json()) as Partial<FlutterwaveWebhookBody>;

    // Only act on charge.completed; ack everything else (incl. test pings) with 200
    // so Flutterwave doesn't retry or disable the endpoint.
    if (payload?.event !== 'charge.completed') {
      return NextResponse.json({ ok: true, message: 'Event ignored' });
    }

    // Guard the data object before destructuring — a missing/!malformed `data`
    // must not throw (which would surface as a 500 and trigger retries).
    if (!payload.data || typeof payload.data.tx_ref !== 'string') {
      logger.warn('webhook.flutterwave.malformed_payload');
      return NextResponse.json({ ok: true, message: 'Malformed payload ignored' });
    }

    const { tx_ref, id: transactionId } = payload.data;

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
      verifyData?.status !== 'success' ||
      verifyData?.data?.status !== 'successful' ||
      verifyData?.data?.amount !== payment.amountKobo / 100 ||
      verifyData?.data?.currency !== payment.currency ||
      verifyData?.data?.tx_ref !== payment.txRef
    ) {
      logger.warn('webhook.flutterwave.validation_checks_failed', { tx_ref });
      return NextResponse.json({ ok: true, message: 'Validation checks failed' });
    }

    // Update payment + bill + award reward points in a single transaction.
    // Points come ONLY from real successful payments (exploit-resistant).
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
        await tx.rewardAccount.upsert({
          where: { residentId: payment.residentId },
          update: {
            balance: { increment: POINTS_PER_BILL_PAYMENT },
            totalEarned: { increment: POINTS_PER_BILL_PAYMENT },
          },
          create: {
            residentId: payment.residentId,
            balance: POINTS_PER_BILL_PAYMENT,
            totalEarned: POINTS_PER_BILL_PAYMENT,
            totalRedeemed: 0,
          },
        });
        await tx.pointTransaction.create({
          data: {
            residentId: payment.residentId,
            amount: POINTS_PER_BILL_PAYMENT,
            type: 'EARNED_BILL_PAYMENT',
            description: `Bill payment reward (₦${(payment.amountKobo / 100).toLocaleString('en-NG')})`,
            billId: payment.billId,
          },
        });
      });

      logger.info('webhook.flutterwave.success', { tx_ref, billId: payment.billId });

      db.notification.create({
        data: {
          residentId: payment.residentId,
          type: 'PAYMENT_CONFIRMATION',
          title: 'Payment Successful',
          body: `Your payment of ₦${(payment.amountKobo / 100).toLocaleString('en-NG')} has been confirmed. Your bill is now marked as paid.`,
          referenceId: payment.id,
        },
      }).catch(() => {});

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

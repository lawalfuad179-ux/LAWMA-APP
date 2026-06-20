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

    const payment = await db.payment.findUnique({ where: { txRef }, include: { bill: true } });

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
        const isBulk = payment.txRef.startsWith('lawma_bulk_');

        await db.$transaction(async (prisma: any) => {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESSFUL',
              gatewayReference: (txData!.flw_ref as string) ?? null,
              paidAt: new Date(),
            },
          });

          if (isBulk) {
            const metaRaw = txData!.meta;
            let billIdsStr: string | undefined;
            if (Array.isArray(metaRaw)) {
              const entry = (metaRaw as Array<Record<string, unknown>>).find((m) => m.metaname === 'bill_ids');
              billIdsStr = entry?.metavalue as string | undefined;
            } else if (metaRaw && typeof metaRaw === 'object') {
              billIdsStr = (metaRaw as Record<string, string>).bill_ids;
            }
            if (billIdsStr) {
              const ids = billIdsStr.split(',');
              await prisma.bill.updateMany({
                where: { id: { in: ids }, residentId: payment.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
                data: { status: 'PAID' },
              });
            } else {
              await prisma.bill.updateMany({
                where: { residentId: payment.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
                data: { status: 'PAID' },
              });
            }
          } else {
            await prisma.bill.update({
              where: { id: payment.billId },
              data: { status: 'PAID' },
            });
          }
        });

        logger.info('payments.status.verified', { txRef, transactionId, isBulk });

        db.notification.create({
          data: {
            residentId: payment.residentId,
            type: 'PAYMENT_CONFIRMATION',
            title: 'Payment Successful',
            body: `Your payment of ₦${(payment.amountKobo / 100).toLocaleString('en-NG')} has been confirmed. Your bill is now marked as paid.`,
            referenceId: payment.id,
          },
        }).catch(() => {});

        return NextResponse.json({
          status: 'SUCCESSFUL',
          amountKobo: payment.amountKobo,
          periodStart: payment.bill?.periodStart ?? null,
          periodEnd: payment.bill?.periodEnd ?? null,
          isBulk,
        });
      }
    } catch (fwError) {
      logger.warn('payments.status.fw_check_error', { txRef, error: String(fwError) });
    }

    // Dev-mode fallback: auto-confirm when Flutterwave sandbox is unreliable
    if (process.env.NODE_ENV === 'development' && payment.status === 'PENDING') {
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

      logger.info('payments.status.dev_auto_confirmed', { txRef, isBulk });
      return NextResponse.json({
        status: 'SUCCESSFUL',
        amountKobo: payment.amountKobo,
        periodStart: payment.bill?.periodStart ?? null,
        periodEnd: payment.bill?.periodEnd ?? null,
        isBulk,
      });
    }

    return NextResponse.json({ status: payment.status });
  } catch (error) {
    logger.error('payments.status.failed', { error: String(error) });
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

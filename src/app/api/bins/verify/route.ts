import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const BIN_PRICE_KOBO = 1_000_000; // ₦10,000 — mirrors bins/order/route.ts

async function persistOrder(params: {
  residentId: string;
  txRef: string;
  binType: string;
  binLabel: string;
  quantity: number;
  amountKobo: number;
  deliveryAddress: string;
}) {
  // Idempotent: the client polls this endpoint on the redirect page, so the
  // same successful verification can arrive more than once.
  try {
    await db.binOrder.upsert({
      where: { txRef: params.txRef },
      update: {},
      create: {
        residentId: params.residentId,
        txRef: params.txRef,
        binType: params.binType,
        binLabel: params.binLabel,
        quantity: params.quantity,
        amountKobo: params.amountKobo,
        deliveryAddress: params.deliveryAddress,
        status: 'SUCCESSFUL',
      },
    });
  } catch (err) {
    logger.error('bins.verify.persist_failed', { txRef: params.txRef, error: String(err) });
  }
}

type BinVerifySuccess = {
  status: 'SUCCESSFUL';
  binType: string;
  binLabel: string;
  quantity: number;
  amountNaira: number;
  deliveryAddress: string;
};

type BinVerifyOther = { status: 'FAILED' | 'PENDING' | 'INVALID' };

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<BinVerifyOther>({ status: 'INVALID' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');
    const urlStatus = searchParams.get('status'); // Flutterwave's own redirect param

    if (!txRef || !txRef.startsWith('lawma_bin_')) {
      return NextResponse.json<BinVerifyOther>({ status: 'INVALID' }, { status: 400 });
    }

    // Cancelled by user before completing payment
    if (urlStatus === 'cancelled') {
      return NextResponse.json<BinVerifyOther>({ status: 'FAILED' });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    let txData: Record<string, unknown> | null = null;

    try {
      if (transactionId) {
        const res = await fetch(
          `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
          { headers: { Authorization: `Bearer ${secretKey}` } }
        );
        if (res.ok) {
          const body = await res.json();
          if (body.status === 'success' && body.data) txData = body.data;
        }
      } else {
        const res = await fetch(
          `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
          { headers: { Authorization: `Bearer ${secretKey}` } }
        );
        if (res.ok) {
          const body = await res.json();
          txData = body.data?.[0] ?? null;
        }
      }
    } catch (fwErr) {
      logger.warn('bins.verify.fw_error', { txRef, error: String(fwErr) });
    }

    if (txData && txData.status === 'successful' && txData.tx_ref === txRef && txData.currency === 'NGN') {
      const rawMeta = txData.meta as Record<string, string> | Array<{ metaname: string; metavalue: string }> | null;
      let meta: Record<string, string> = {};
      if (Array.isArray(rawMeta)) {
        for (const entry of rawMeta) meta[entry.metaname] = entry.metavalue;
      } else if (rawMeta && typeof rawMeta === 'object') {
        meta = rawMeta;
      }

      logger.info('bins.verify.successful', { txRef, transactionId });

      const binType = meta.bin_type || 'green';
      const binLabel = meta.bin_label || 'Smart Bin';
      const quantity = parseInt(meta.quantity || '1', 10);
      const amountNaira = txData.amount as number;
      const deliveryAddress = meta.delivery_address || '';

      await persistOrder({
        residentId: session.residentId,
        txRef,
        binType,
        binLabel,
        quantity,
        amountKobo: Math.round(amountNaira * 100),
        deliveryAddress,
      });

      return NextResponse.json<BinVerifySuccess>({
        status: 'SUCCESSFUL',
        binType,
        binLabel,
        quantity,
        amountNaira,
        deliveryAddress,
      });
    }

    // Dev-mode fallback: sandbox verify is unreliable; trust the redirect status param
    if (process.env.NODE_ENV === 'development' && urlStatus === 'successful') {
      logger.info('bins.verify.dev_auto_confirmed', { txRef });

      await persistOrder({
        residentId: session.residentId,
        txRef,
        binType: 'green',
        binLabel: 'Keep Lagos Clean (Green)',
        quantity: 1,
        amountKobo: BIN_PRICE_KOBO,
        deliveryAddress: '',
      });

      return NextResponse.json<BinVerifySuccess>({
        status: 'SUCCESSFUL',
        binType: 'green',
        binLabel: 'Keep Lagos Clean (Green)',
        quantity: 1,
        amountNaira: 10000,
        deliveryAddress: '',
      });
    }

    // Flutterwave may still be processing — let the client retry
    return NextResponse.json<BinVerifyOther>({ status: 'PENDING' });
  } catch (error) {
    logger.error('bins.verify.failed', { error: String(error) });
    return NextResponse.json<BinVerifyOther>({ status: 'FAILED' }, { status: 500 });
  }
}

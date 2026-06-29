import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

      return NextResponse.json<BinVerifySuccess>({
        status: 'SUCCESSFUL',
        binType: meta.bin_type || 'green',
        binLabel: meta.bin_label || 'Smart Bin',
        quantity: parseInt(meta.quantity || '1', 10),
        amountNaira: txData.amount as number,
        deliveryAddress: meta.delivery_address || '',
      });
    }

    // Dev-mode fallback: sandbox verify is unreliable; trust the redirect status param
    if (process.env.NODE_ENV === 'development' && urlStatus === 'successful') {
      logger.info('bins.verify.dev_auto_confirmed', { txRef });
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

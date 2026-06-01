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

    return NextResponse.json({ status: payment.status });
  } catch (error) {
    logger.error('payments.status.failed', { error: String(error) });
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

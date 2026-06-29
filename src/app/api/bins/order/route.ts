import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createPaymentLink } from '@/lib/flutterwave';

const BIN_PRICE_KOBO = 1_000_000; // ₦10,000

const orderSchema = z.object({
  binType: z.enum(['green', 'blue']),
  quantity: z.number().int().min(1).max(5),
  deliveryAddress: z.string().min(5),
});

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { checkoutUrl: string } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Please check your order details.' } }, { status: 400 });
    }

    const { binType, quantity, deliveryAddress } = parsed.data;

    const resident = await db.resident.findUnique({ where: { id: session.residentId } });
    if (!resident) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Resident not found.' } }, { status: 404 });
    }

    const totalKobo = BIN_PRICE_KOBO * quantity;
    const txRef = `lawma_bin_${session.residentId}_${Date.now()}`;
    const binLabel = binType === 'blue' ? 'Lagos Recycles (Blue)' : 'Keep Lagos Clean (Green)';

    const result = await createPaymentLink({
      txRef,
      amountKobo: totalKobo,
      customerPhone: resident.phoneNumber ?? '',
      customerName: resident.name || resident.phoneNumber || 'Resident',
      customerEmail: resident.email ?? undefined,
      billId: 'bin_order',
      residentId: session.residentId,
      paymentId: txRef,
      redirectPath: '/smart-bins',
      meta: {
        order_type: 'smart_bin',
        bin_type: binType,
        bin_label: binLabel,
        quantity: String(quantity),
        delivery_address: deliveryAddress,
      },
    });

    if (!result.ok) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'payment_gateway_error', message: result.error } }, { status: 502 });
    }

    logger.info('bins.order.initialized', { txRef, binType, quantity, residentId: session.residentId });

    return NextResponse.json<Success>({ ok: true, data: { checkoutUrl: result.checkoutUrl } });
  } catch (error) {
    logger.error('bins.order.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } }, { status: 500 });
  }
}

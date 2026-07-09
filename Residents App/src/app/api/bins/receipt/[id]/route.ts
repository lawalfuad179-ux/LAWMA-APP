import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PAYMENT_STATUS_LABELS } from '@/constants';

type Failure = { ok: false; error: { code: string; message: string } };

function formatNaira(kobo: number) {
  return `NGN ${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const { id } = await params;
    const order = await db.binOrder.findFirst({
      where: { id, residentId: session.residentId },
      include: { resident: { select: { name: true, phoneNumber: true } } },
    });

    if (!order) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'not_found', message: 'Order not found.' } }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const green = rgb(0.04, 0.36, 0.23);
    const muted = rgb(0.45, 0.45, 0.45);
    const ink = rgb(0.12, 0.12, 0.12);

    let y = 780;
    page.drawText('LAWMA', { x: 48, y, size: 22, font: helvBold, color: green });
    page.drawText('Lagos Waste Management Authority', { x: 48, y: y - 18, size: 10, font: helv, color: muted });
    page.drawText('Smart Bin Order Receipt', { x: 48, y: y - 56, size: 18, font: helvBold, color: ink });

    y = 690;
    const labelX = 48;
    const valueX = 220;
    const rowGap = 22;

    const rows: [string, string][] = [
      ['Order Ref.', order.txRef],
      ['Bin', order.binLabel],
      ['Quantity', String(order.quantity)],
      ['Amount', formatNaira(order.amountKobo)],
      ['Status', PAYMENT_STATUS_LABELS[order.status] || order.status],
      ['Date Ordered', formatDate(order.createdAt)],
      ['Delivery Address', order.deliveryAddress],
      ['', ''],
      ['Resident', order.resident.name || '—'],
      ['Phone', order.resident.phoneNumber || '—'],
    ];

    for (const [label, value] of rows) {
      if (label) page.drawText(label, { x: labelX, y, size: 10, font: helv, color: muted });
      if (value) page.drawText(value, { x: valueX, y, size: 11, font: helvBold, color: ink, maxWidth: 320 });
      y -= rowGap;
    }

    y -= 16;
    page.drawText('Thank you for ordering through the LAWMA app.', { x: 48, y, size: 10, font: helv, color: muted });
    y -= 14;
    page.drawText('This is a system-generated receipt; no signature required.', { x: 48, y, size: 9, font: helv, color: muted });

    page.drawText(`Generated ${new Date().toISOString()}`, { x: 48, y: 36, size: 8, font: helv, color: muted });

    const bytes = await pdf.save();

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lawma-bin-order-${order.txRef.slice(0, 24)}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    logger.error('bins.receipt.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Could not generate receipt.' } }, { status: 500 });
  }
}

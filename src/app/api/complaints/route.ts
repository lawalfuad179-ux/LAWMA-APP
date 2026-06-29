import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const complaintSchema = z.object({
  issueType: z.enum(['MISSED_PICKUP', 'ILLEGAL_DUMPING', 'OVERFLOWING_BIN', 'PSP_MISCONDUCT', 'WASTE_BURNING', 'OTHER']),
  area: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  description: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrls: z.array(z.string().url()).max(3).optional(),
});

type Failure = { ok: false; error: { code: string; message: string } };
type Success = { ok: true; data: { id: string } };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = complaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'invalid_input', message: 'Check your input.' } }, { status: 400 });
    }

    const { issueType, area, address, description, latitude, longitude, imageUrls } = parsed.data;

    // Duplicate check: same issue type, area, within 48 hours
    const recent = await db.complaint.findFirst({
      where: {
        residentId: session.residentId,
        issueType,
        area,
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    });

    if (recent) {
      return NextResponse.json<Failure>({
        ok: false,
        error: { code: 'duplicate', message: 'A similar report already exists in your area.' },
      }, { status: 409 });
    }

    const resident = await db.resident.findUnique({ where: { id: session.residentId } });

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const slug = (resident?.lga || 'LAG').slice(0, 3).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketId = `LW-${datePart}-${slug}${rand}`;

    const complaint = await db.complaint.create({
      data: {
        ticketId,
        residentId: session.residentId,
        issueType,
        lga: resident?.lga || '',
        area,
        address,
        description: description || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });

    if (imageUrls && imageUrls.length > 0) {
      await db.complaintImage.createMany({
        data: imageUrls.map((url) => ({ complaintId: complaint.id, url })),
      });
    }

    logger.info('complaint.created', { complaintId: complaint.id, issueType, lga: resident?.lga });

    // In-app notification — fire and forget, never block the response
    db.notification.create({
      data: {
        residentId: session.residentId,
        type: 'COMPLAINT_UPDATE',
        title: 'Complaint Submitted',
        body: `Your complaint (${ticketId}) has been received and is under review. You'll be notified as it progresses.`,
        referenceId: complaint.id,
      },
    }).catch(() => {});

    return NextResponse.json<Success>({ ok: true, data: { id: complaint.id } }, { status: 201 });
  } catch (error) {
    logger.error('complaints.create.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

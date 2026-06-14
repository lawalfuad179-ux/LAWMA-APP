import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const prefs = await db.notificationPreference.upsert({
    where:  { residentId: session.residentId },
    create: { residentId: session.residentId },
    update: {},
  });

  return NextResponse.json({ ok: true, data: prefs });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, boolean>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const allowed = [
    'emailComplaintUpdates',
    'emailPaymentReceipts',
    'emailCollectionReminders',
    'emailAnnouncements',
    'smsComplaintUpdates',
    'smsCollectionReminders',
    'smsDelayedPickup',
  ] as const;

  const data: Partial<Record<typeof allowed[number], boolean>> = {};
  for (const key of allowed) {
    if (typeof body[key] === 'boolean') data[key] = body[key];
  }

  const prefs = await db.notificationPreference.upsert({
    where:  { residentId: session.residentId },
    create: { residentId: session.residentId, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, data: prefs });
}

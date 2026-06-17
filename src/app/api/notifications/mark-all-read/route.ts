import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  await db.notification.updateMany({
    where: { residentId: session.residentId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}

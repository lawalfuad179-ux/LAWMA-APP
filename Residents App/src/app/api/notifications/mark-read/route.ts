import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: { notificationId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  if (!body.notificationId) {
    return NextResponse.json({ ok: false, error: 'Missing notificationId' }, { status: 422 });
  }

  const notification = await db.notification.findUnique({ where: { id: body.notificationId } });
  if (!notification) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (notification.residentId !== session.residentId) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  await db.notification.update({ where: { id: body.notificationId }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}

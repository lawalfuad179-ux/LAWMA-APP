import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });

  const count = await db.notification.count({
    where: { residentId: session.residentId, isRead: false },
  });

  return NextResponse.json({ count });
}

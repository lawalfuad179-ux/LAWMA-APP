import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type Failure = { ok: false; error: { code: string; message: string } };

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>({ ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } }, { status: 401 });
    }

    const activities = await db.recycleActivity.findMany({
      where: { residentId: session.residentId, status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        imageUrl: true,
        aiReport: true,
        confirmedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, data: { activities } });
  } catch (error) {
    logger.error('recycle.history.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

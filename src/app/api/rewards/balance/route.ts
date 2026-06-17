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

    const [rewardAccount, transactions] = await Promise.all([
      db.rewardAccount.findUnique({ where: { residentId: session.residentId } }),
      db.pointTransaction.findMany({
        where: { residentId: session.residentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        balance: rewardAccount?.balance ?? 0,
        totalEarned: rewardAccount?.totalEarned ?? 0,
        totalRedeemed: rewardAccount?.totalRedeemed ?? 0,
        transactions,
      },
    });
  } catch (error) {
    logger.error('rewards.balance.failed', { error: String(error) });
    return NextResponse.json<Failure>({ ok: false, error: { code: 'server_error', message: 'Something went wrong.' } }, { status: 500 });
  }
}

import type { Metadata } from 'next';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { CenterKiosk } from '@/components/center/CenterKiosk';
import { CenterLogin } from '@/components/center/CenterLogin';

export const metadata: Metadata = {
  title: 'Collection Centre — LAWMA',
  description: 'Buy-back counter for LAWMA collection centres.',
};

// Session state is per-request; never cache this route.
export const dynamic = 'force-dynamic';

export default async function CenterPage() {
  const session = await getCenterSession();
  if (!session) return <CenterLogin />;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const totals = await db.dropOff.aggregate({
    where: {
      operatorId: session.operatorId,
      status: { in: ['CONFIRMED', 'FLAGGED'] },
      createdAt: { gte: startOfDay },
    },
    _sum: { weightGrams: true, amountKobo: true },
    _count: { _all: true },
  });

  return (
    <CenterKiosk
      operatorName={session.operatorName}
      centerName={session.centerName}
      initialToday={{
        dropOffs: totals._count._all,
        weightGrams: totals._sum.weightGrams ?? 0,
        amountKobo: totals._sum.amountKobo ?? 0,
      }}
    />
  );
}

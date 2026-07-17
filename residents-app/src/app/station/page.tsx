import type { Metadata } from 'next';

import { getCenterSession } from '@/lib/center-auth';
import { db } from '@/lib/db';
import { StationKiosk } from '@/components/station/StationKiosk';
import { CenterLogin } from '@/components/center/CenterLogin';

export const metadata: Metadata = {
  title: 'Transfer Station — LAWMA',
  description: 'Weighbridge console for LAWMA transfer stations.',
};

// Session state is per-request; never cache this route.
export const dynamic = 'force-dynamic';

export default async function StationPage() {
  const session = await getCenterSession();
  if (!session) {
    return (
      <CenterLogin
        title="Transfer station"
        subtitle="Staff sign-in for the weighbridge console."
        cta="Arm the bridge"
        redirectTo="/station"
        placeholderCode="EBT01"
      />
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totals, tricycles, rate] = await Promise.all([
    db.weighEvent.aggregate({
      where: {
        stationId: session.centerId,
        status: { in: ['SETTLED', 'FLAGGED_NEGATIVE'] },
        createdAt: { gte: startOfDay },
      },
      _sum: { grossWeightGrams: true, feeKobo: true },
      _count: { _all: true },
    }),
    db.tricycle.findMany({
      where: { isActive: true },
      orderBy: { operatorName: 'asc' },
      select: {
        id: true,
        rfidTag: true,
        plateNumber: true,
        operatorName: true,
        zone: true,
        walletBalanceKobo: true,
      },
    }),
    db.tippingRate.findFirst({ where: { isActive: true }, select: { koboPerKg: true } }),
  ]);

  return (
    <StationKiosk
      operatorName={session.operatorName}
      stationName={session.centerName}
      initialToday={{
        passes: totals._count._all,
        weightGrams: totals._sum.grossWeightGrams ?? 0,
        feesKobo: totals._sum.feeKobo ?? 0,
      }}
      initialTricycles={tricycles}
      rateKoboPerKg={rate?.koboPerKg ?? null}
    />
  );
}

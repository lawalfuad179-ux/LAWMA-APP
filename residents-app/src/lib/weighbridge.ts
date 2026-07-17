import { buildReceiptCode, computeAmountKobo } from './dropoff-guard';
import { db } from './db';

/**
 * Weighbridge guard — same philosophy as dropoff-guard: FLAG, never BLOCK.
 * A loaded tricycle standing on the bridge cannot be turned away; the event
 * settles, the anomaly is recorded against the attendant's ID, and a
 * supervisor reviews flags. Insufficient funds is the canonical case: the
 * wallet goes negative, the debt shows in red until the next top-up.
 */
export const WEIGH_GUARD = {
  // A tricycle compactor physically tops out well under this.
  MAX_SINGLE_KG: 500,
  // Two passes within this window means a double-scan or a queue mistake.
  REENTRY_WINDOW_MS: 5 * 60 * 1000,
};

export type WeighVerdict = {
  flagged: boolean;
  reason: string | null;
  negative: boolean;
};

export function computeTippingFeeKobo(weightGrams: number, koboPerKg: number): number {
  return computeAmountKobo(weightGrams, koboPerKg);
}

export function buildStationReceiptCode(stationName: string): string {
  return buildReceiptCode(stationName);
}

export async function evaluateWeigh(input: {
  tricycleId: string;
  weightGrams: number;
  feeKobo: number;
  walletBalanceKobo: number;
}): Promise<WeighVerdict> {
  const reasons: string[] = [];
  const negative = input.walletBalanceKobo - input.feeKobo < 0;

  if (negative) {
    reasons.push('Wallet balance insufficient — settled into arrears');
  }
  if (input.weightGrams > WEIGH_GUARD.MAX_SINGLE_KG * 1000) {
    reasons.push(`Load exceeds ${WEIGH_GUARD.MAX_SINGLE_KG}kg plausibility limit`);
  }

  const lastPass = await db.weighEvent.findFirst({
    where: {
      tricycleId: input.tricycleId,
      createdAt: { gte: new Date(Date.now() - WEIGH_GUARD.REENTRY_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (lastPass) {
    const mins = Math.round((Date.now() - lastPass.createdAt.getTime()) / 60000);
    reasons.push(`Tricycle already weighed ${mins} min ago`);
  }

  return {
    flagged: reasons.length > 0,
    reason: reasons.length ? reasons.join('; ') : null,
    negative,
  };
}

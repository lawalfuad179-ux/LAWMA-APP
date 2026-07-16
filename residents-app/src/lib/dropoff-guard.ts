import { db } from '@/lib/db';

// Abuse controls for counter buy-back.
//
// Design note — these FLAG, they do not BLOCK.
// A collection centre is a staffed facility with a physical queue. Refusing a
// weigh-in at the counter means an argument with a resident while fifty people
// wait behind them, and staff will route around any rule that does that. So the
// guard always credits, marks the row FLAGGED, and leaves it for a supervisor
// to VOID out-of-band. Staffing is the real control; this is the audit trail.
export const DROPOFF_GUARD = {
  // A single hand-carried weigh-in above this is implausible and likely a
  // mis-keyed weight (e.g. grams typed into the kg field).
  MAX_SINGLE_KG: 100,
  // Per-resident, per-rolling-24h. Generous enough for a genuine household
  // bulk clear-out; tight enough that recycling the same sack all day shows up.
  DAILY_KG_CAP: 50,
  // Same resident weighed again inside this window — consistent with a sack
  // being carried back around to the queue.
  REENTRY_WINDOW_MS: 10 * 60 * 1000,
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000,
};

export type GuardVerdict = {
  flagged: boolean;
  reason: string | null;
};

/**
 * Evaluates a proposed weigh-in against the abuse heuristics.
 * Never throws and never rejects — returns whether the row should be written
 * as FLAGGED, and why. Reasons are written to DropOff.flagReason for review.
 */
export async function evaluateDropOff(args: {
  residentId: string;
  weightGrams: number;
}): Promise<GuardVerdict> {
  const { residentId, weightGrams } = args;
  const reasons: string[] = [];

  // ── Layer 1: implausible single weight ──────────────────────────────────
  const kg = weightGrams / 1000;
  if (kg > DROPOFF_GUARD.MAX_SINGLE_KG) {
    reasons.push(
      `Single weigh-in of ${kg.toFixed(1)}kg exceeds the ${DROPOFF_GUARD.MAX_SINGLE_KG}kg plausibility limit`,
    );
  }

  // ── Layer 2: rolling 24h weight cap for this resident ───────────────────
  const dayWindow = new Date(Date.now() - DROPOFF_GUARD.DAILY_WINDOW_MS);
  const todays = await db.dropOff.aggregate({
    where: {
      residentId,
      status: { in: ['CONFIRMED', 'FLAGGED'] },
      createdAt: { gte: dayWindow },
    },
    _sum: { weightGrams: true },
  });
  const priorGrams = todays._sum.weightGrams ?? 0;
  const totalKg = (priorGrams + weightGrams) / 1000;
  if (totalKg > DROPOFF_GUARD.DAILY_KG_CAP) {
    reasons.push(
      `Resident would reach ${totalKg.toFixed(1)}kg in 24h, over the ${DROPOFF_GUARD.DAILY_KG_CAP}kg cap`,
    );
  }

  // ── Layer 3: rapid re-entry ─────────────────────────────────────────────
  const reentrySince = new Date(Date.now() - DROPOFF_GUARD.REENTRY_WINDOW_MS);
  const recent = await db.dropOff.findFirst({
    where: {
      residentId,
      status: { in: ['CONFIRMED', 'FLAGGED'] },
      createdAt: { gte: reentrySince },
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (recent) {
    const minsAgo = Math.round((Date.now() - recent.createdAt.getTime()) / 60000);
    reasons.push(`Resident already weighed in ${minsAgo} min ago`);
  }

  return {
    flagged: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join('; ') : null,
  };
}

/** Buy-back payout for a weight at a given rate. Rounded down to whole kobo. */
export function computeAmountKobo(weightGrams: number, koboPerKg: number): number {
  return Math.floor((weightGrams / 1000) * koboPerKg);
}

/**
 * Human-readable receipt code handed to the resident at the counter, e.g.
 * "SIM-7F3K2". Prefix ties it to the centre so a paper dispute can be traced
 * without the resident knowing any internal id.
 */
export function buildReceiptCode(centerName: string): string {
  const prefix = centerName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CTR';
  // Ambiguous glyphs (0/O, 1/I) removed — this gets read aloud and hand-copied.
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let body = '';
  for (let i = 0; i < 5; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${body}`;
}

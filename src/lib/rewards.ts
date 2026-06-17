import type { RecycleAiReport } from './ai';

export const POINTS = {
  BASE_PER_SCAN: 10,
  PER_RECYCLABLE_ITEM: 2,
  BONUS_FIRST_SCAN: 25,
  BONUS_LARGE_BATCH: 20, // 10+ recyclable items
  LARGE_BATCH_THRESHOLD: 10,
} as const;

// 100 points = ₦100 = 10_000 kobo
export const POINTS_TO_KOBO = 100;
export const MIN_REDEEM_POINTS = 100;
export const MAX_REDEEM_FRACTION = 0.5; // max 50% of bill

export function calcPointsForScan(report: RecycleAiReport, isFirstScan: boolean): number {
  let pts = POINTS.BASE_PER_SCAN;
  pts += report.recyclableCount * POINTS.PER_RECYCLABLE_ITEM;
  if (report.recyclableCount >= POINTS.LARGE_BATCH_THRESHOLD) {
    pts += POINTS.BONUS_LARGE_BATCH;
  }
  if (isFirstScan) {
    pts += POINTS.BONUS_FIRST_SCAN;
  }
  return pts;
}

export function pointsToKobo(points: number): number {
  return points * POINTS_TO_KOBO;
}

export function koboToPoints(kobo: number): number {
  return Math.floor(kobo / POINTS_TO_KOBO);
}

export function maxRedeemablePoints(billAmountKobo: number, currentDiscountKobo: number): number {
  const remainingKobo = billAmountKobo - currentDiscountKobo;
  const maxDiscountKobo = Math.floor(remainingKobo * MAX_REDEEM_FRACTION);
  return koboToPoints(maxDiscountKobo);
}

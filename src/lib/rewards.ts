// 5 reward points per successful bill payment.
// Exploit-resistant: requires actual money to move.
export const POINTS_PER_BILL_PAYMENT = 5;

// 100 points = ₦100 = 10_000 kobo
export const POINTS_TO_KOBO = 100;
export const MIN_REDEEM_POINTS = 100;
export const MAX_REDEEM_FRACTION = 0.5; // max 50% of bill

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

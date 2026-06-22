// 5 reward points per successful bill payment.
// Exploit-resistant: requires actual money to move.
export const POINTS_PER_BILL_PAYMENT = 5;

/**
 * Award reward points for a successful bill payment.
 * Idempotent — safe to call from both the Flutterwave webhook AND the
 * status-poll fallback. Whoever marks the payment successful first wins;
 * subsequent calls detect the existing PointTransaction and no-op.
 *
 * Must be invoked inside a Prisma transaction.
 */
export async function awardBillPaymentPoints(
  // Prisma 7 client has no exported TxClient type; `any` here is intentional
  // and contained — keeps the helper usable from both webhook and status route.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  payment: { residentId: string; billId: string; amountKobo: number },
): Promise<{ awarded: number; newBalance: number }> {
  const existing = await tx.pointTransaction.findFirst({
    where: {
      residentId: payment.residentId,
      billId: payment.billId,
      type: 'EARNED_BILL_PAYMENT',
    },
    select: { id: true },
  });
  if (existing) {
    // Points were already awarded for this payment (the other code path
    // got there first). Surface the canonical 5 anyway so the UI can show
    // a truthful "you earned X points" — the user did earn them.
    const acct = await tx.rewardAccount.findUnique({
      where: { residentId: payment.residentId },
      select: { balance: true },
    });
    return { awarded: POINTS_PER_BILL_PAYMENT, newBalance: acct?.balance ?? 0 };
  }

  const acct = await tx.rewardAccount.upsert({
    where: { residentId: payment.residentId },
    update: {
      balance: { increment: POINTS_PER_BILL_PAYMENT },
      totalEarned: { increment: POINTS_PER_BILL_PAYMENT },
    },
    create: {
      residentId: payment.residentId,
      balance: POINTS_PER_BILL_PAYMENT,
      totalEarned: POINTS_PER_BILL_PAYMENT,
      totalRedeemed: 0,
    },
  });
  await tx.pointTransaction.create({
    data: {
      residentId: payment.residentId,
      amount: POINTS_PER_BILL_PAYMENT,
      type: 'EARNED_BILL_PAYMENT',
      description: `Bill payment reward (₦${(payment.amountKobo / 100).toLocaleString('en-NG')})`,
      billId: payment.billId,
    },
  });
  return { awarded: POINTS_PER_BILL_PAYMENT, newBalance: acct.balance };
}

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

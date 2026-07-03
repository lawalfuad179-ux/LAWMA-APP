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

// 1 point = ₦1 = 100 kobo. Picked at this rate so the math is legible to a
// resident ("you have 12 points = ₦12 credit") without divisions in their head.
export const POINTS_TO_KOBO = 100;

// Minimum points the system will redeem in a single transaction. 1 means
// every point earned can be auto-applied to the next bill — no "save up for
// 100 points" friction. Govt-utility users open this app monthly at best;
// they shouldn't have to remember a balance.
export const MIN_REDEEM_POINTS = 1;

// Hard cap to keep a single bill payment from being entirely paid by points.
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

/**
 * Decide how many points to auto-apply to a bill at payment-initiate time.
 * Caps at `MAX_REDEEM_FRACTION` of the bill's remaining undiscounted amount
 * and at the user's available balance. Returns 0 if there's nothing to apply.
 */
export function computeAutoRedeem(
  billAmountKobo: number,
  currentDiscountKobo: number,
  availablePoints: number,
): number {
  if (availablePoints < MIN_REDEEM_POINTS) return 0;
  const headroom = maxRedeemablePoints(billAmountKobo, currentDiscountKobo);
  if (headroom <= 0) return 0;
  return Math.min(availablePoints, headroom);
}

/**
 * Read-only projection of the total reward discount that would be applied
 * across a set of bills if they were all paid via "Pay All" right now —
 * mirrors the cascading redemption loop in /api/payments/initialize-all
 * (each bill capped at its own 50% headroom, remaining points carrying into
 * the next bill in the given order). Does not mutate anything; for display
 * purposes only (e.g. the outstanding-balance summary).
 */
export function projectCascadingDiscountKobo(
  bills: { amountKobo: number; discountKobo: number }[],
  availablePoints: number,
): number {
  let pointsLeft = availablePoints;
  let totalDiscountKobo = 0;
  for (const b of bills) {
    const pts = computeAutoRedeem(b.amountKobo, b.discountKobo, pointsLeft);
    if (pts > 0) {
      totalDiscountKobo += pointsToKobo(pts);
      pointsLeft -= pts;
    }
  }
  return totalDiscountKobo;
}

/**
 * Apply a redemption inside a Prisma transaction.
 * Updates Bill.discountKobo, decrements RewardAccount.balance, and writes
 * a REDEEMED_BILL_DISCOUNT PointTransaction. Returns the discount in kobo
 * and the resulting balance.
 *
 * Caller is responsible for checking that `points >= MIN_REDEEM_POINTS`
 * and `points <= maxRedeemablePoints(...)`. Use computeAutoRedeem() to
 * derive a safe value before invoking this.
 */
export async function applyRedemption(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  args: { residentId: string; billId: string; points: number },
): Promise<{ discountKobo: number; newBalance: number }> {
  const discountKobo = pointsToKobo(args.points);

  await tx.bill.update({
    where: { id: args.billId },
    data: { discountKobo: { increment: discountKobo } },
  });

  const acct = await tx.rewardAccount.update({
    where: { residentId: args.residentId },
    data: {
      balance: { decrement: args.points },
      totalRedeemed: { increment: args.points },
    },
  });

  await tx.pointTransaction.create({
    data: {
      residentId: args.residentId,
      amount: -args.points,
      type: 'REDEEMED_BILL_DISCOUNT',
      description: `Auto-applied ₦${(discountKobo / 100).toLocaleString('en-NG')} reward credit`,
      billId: args.billId,
    },
  });

  return { discountKobo, newBalance: acct.balance };
}

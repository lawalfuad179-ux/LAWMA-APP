import { redirect } from 'next/navigation';
import { Receipt, Star, Download } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BalanceCard } from './BalanceCard';
import { PayNowButton } from './PayNowButton';
import { EmptyBillsState } from './EmptyBillsState';
import { PaymentVerifySheet } from './PaymentVerifySheet';
import { BILL_STATUS_LABELS } from '@/constants';
import { computeAutoRedeem, pointsToKobo } from '@/lib/rewards';
import styles from './page.module.css';

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [bills, rewardAccount] = await Promise.all([
    db.bill.findMany({
      where: { residentId: session.residentId },
      orderBy: { dueDate: 'asc' },
    }),
    db.rewardAccount.findUnique({
      where: { residentId: session.residentId },
      select: { balance: true },
    }),
  ]);

  const rewardBalance = rewardAccount?.balance ?? 0;
  const rewardCreditKobo = pointsToKobo(rewardBalance);

  // Outstanding = amount the resident actually owes after any discount
  // already applied to a bill.
  const totalOutstanding = bills
    .filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + (b.amountKobo - b.discountKobo), 0);

  const pendingCount = bills.filter((b) => b.status === 'PENDING').length;
  const overdueCount = bills.filter((b) => b.status === 'OVERDUE').length;

  return (
    <div className={styles.page}>
      <PaymentVerifySheet />
      <h1 className={styles.title}>Payments</h1>

      <BalanceCard
        totalKobo={totalOutstanding}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
      />

      <div className={styles.rewardBanner}>
        <Star size={16} strokeWidth={1.8} className={styles.rewardBannerIcon} />
        <p className={styles.rewardBannerText}>
          {rewardBalance > 0 ? (
            <>
              <strong>You have {rewardBalance} reward {rewardBalance === 1 ? 'point' : 'points'} (₦{(rewardCreditKobo / 100).toLocaleString('en-NG')}) in credit.</strong>{' '}
              It will be applied automatically to your next bill payment.
            </>
          ) : (
            <>
              <strong>Earn 5 reward points</strong> every time you pay your bill through the LAWMA app — automatically credited to your next bill.
            </>
          )}
        </p>
      </div>

      {bills.length > 0 ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>
              <Receipt size={15} strokeWidth={1.5} />
              <span>Bill History</span>
            </div>
          </div>
          <div className={styles.list}>
            {bills.map((bill) => {
              const isOutstanding = bill.status === 'PENDING' || bill.status === 'OVERDUE';
              // Preview what the auto-applied credit will look like at click time.
              const projectedPoints = isOutstanding
                ? computeAutoRedeem(bill.amountKobo, bill.discountKobo, rewardBalance)
                : 0;
              const projectedDiscountKobo = pointsToKobo(projectedPoints);
              const effectiveAmountKobo = bill.amountKobo - bill.discountKobo - projectedDiscountKobo;

              return (
                <Card key={bill.id} className={styles.billCard}>
                  <div className={styles.billTop}>
                    <div className={styles.billPeriod}>
                      {new Date(bill.periodStart).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      {' — '}
                      {new Date(bill.periodEnd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <Badge
                      label={BILL_STATUS_LABELS[bill.status]}
                      variant={
                        bill.status === 'PAID' ? 'success' :
                        bill.status === 'OVERDUE' ? 'error' : 'warning'
                      }
                    />
                  </div>
                  <div className={styles.billBottom}>
                    {isOutstanding && (bill.discountKobo > 0 || projectedDiscountKobo > 0) ? (
                      <div className={styles.billAmountStack}>
                        <span className={styles.billAmountStrike}>{formatKobo(bill.amountKobo)}</span>
                        <span className={styles.billAmount}>{formatKobo(effectiveAmountKobo)}</span>
                      </div>
                    ) : (
                      <span className={styles.billAmount}>{formatKobo(bill.amountKobo)}</span>
                    )}
                    <div className={styles.billDue}>
                      Due {new Date(bill.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {isOutstanding && (bill.discountKobo > 0 || projectedDiscountKobo > 0) && (
                    <p className={styles.billDiscountNote}>
                      <Star size={12} strokeWidth={1.8} />
                      {projectedDiscountKobo > 0
                        ? `${projectedPoints} pts (₦${(projectedDiscountKobo / 100).toLocaleString('en-NG')}) will apply on Pay Now`
                        : `₦${(bill.discountKobo / 100).toLocaleString('en-NG')} reward credit applied`}
                    </p>
                  )}
                  {isOutstanding && (
                    <PayNowButton billId={bill.id} label={`Pay Now — ${formatKobo(effectiveAmountKobo)}`} />
                  )}
                  {bill.status === 'PAID' && (
                    <a
                      href={`/api/payments/receipt/${bill.id}`}
                      className={styles.receiptLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={14} strokeWidth={1.6} />
                      Download receipt (PDF)
                    </a>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyBillsState />
      )}
    </div>
  );
}

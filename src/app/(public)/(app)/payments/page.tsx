import { redirect } from 'next/navigation';
import { Receipt, Star } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCard } from './BalanceCard';
import { EmptyBillsState } from './EmptyBillsState';
import { PaymentVerifySheet } from './PaymentVerifySheet';
import { BillHistoryList } from './BillHistoryList';
import { Reveal } from '@/components/ui/Reveal';
import { pointsToKobo, projectCascadingDiscountKobo } from '@/lib/rewards';
import styles from './page.module.css';

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
  // already applied to a bill, minus the reward credit that would be
  // auto-applied if they paid everything now via "Pay All".
  const outstandingBills = bills.filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE');
  const outstandingBeforeRewards = outstandingBills.reduce((sum, b) => sum + (b.amountKobo - b.discountKobo), 0);
  const projectedRewardDiscountKobo = projectCascadingDiscountKobo(outstandingBills, rewardBalance);
  const totalOutstanding = outstandingBeforeRewards - projectedRewardDiscountKobo;

  const pendingCount = bills.filter((b) => b.status === 'PENDING').length;
  const overdueCount = bills.filter((b) => b.status === 'OVERDUE').length;

  return (
    <div className={styles.page}>
      <PaymentVerifySheet />
      <h1 className={styles.title}>Payments</h1>

      <Reveal delay={0.04} immediate>
        <BalanceCard
          totalKobo={totalOutstanding}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
        />
      </Reveal>

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
        <Reveal className={styles.section} delay={0.1}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>
              <Receipt size={15} strokeWidth={1.5} />
              <span>Bill History</span>
            </div>
          </div>
          <BillHistoryList bills={bills} rewardBalance={rewardBalance} />
        </Reveal>
      ) : (
        <EmptyBillsState />
      )}
    </div>
  );
}

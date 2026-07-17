import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { BalanceCard } from './BalanceCard';
import { EmptyBillsState } from './EmptyBillsState';
import { PaymentVerifySheet } from './PaymentVerifySheet';
import { BillHistoryList } from './BillHistoryList';
import { RewardsWalletCard } from '@/components/rewards/RewardsWalletCard';
import { RewardHistoryList } from '@/components/rewards/RewardHistoryList';
import { Reveal } from '@/components/ui/Reveal';
import { projectCascadingDiscountKobo } from '@/lib/rewards';
import styles from './page.module.css';

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [bills, rewardAccount, ledger] = await Promise.all([
    db.bill.findMany({
      where: { residentId: session.residentId },
      orderBy: { dueDate: 'asc' },
    }),
    db.rewardAccount.findUnique({
      where: { residentId: session.residentId },
      select: { balance: true },
    }),
    db.pointTransaction.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, amount: true, description: true, createdAt: true },
    }),
  ]);

  const rewardBalance = rewardAccount?.balance ?? 0;
  const lastCredit = ledger.find((t) => t.amount > 0) ?? null;

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

      <Reveal delay={0.04} immediate>
        <BalanceCard
          totalKobo={totalOutstanding}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
        />
      </Reveal>

      <Reveal delay={0.07} immediate>
        <RewardsWalletCard
          balancePoints={rewardBalance}
          lastCredit={
            lastCredit
              ? {
                  amountPoints: lastCredit.amount,
                  description: lastCredit.description,
                  createdAt: lastCredit.createdAt,
                }
              : null
          }
        />
      </Reveal>

      {bills.length > 0 ? (
        <Reveal className={styles.section} delay={0.1}>
          <BillHistoryList bills={bills} rewardBalance={rewardBalance} />
        </Reveal>
      ) : (
        <EmptyBillsState />
      )}

      <Reveal delay={0.13} immediate>
        <RewardHistoryList
          rows={ledger.map((t) => ({
            id: t.id,
            amount: t.amount,
            description: t.description,
            createdAt: t.createdAt.toISOString(),
          }))}
        />
      </Reveal>
    </div>
  );
}

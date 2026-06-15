import { redirect } from 'next/navigation';
import { CreditCard, Receipt } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BalanceCard } from './BalanceCard';
import { BILL_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const bills = await db.bill.findMany({
    where: { residentId: session.residentId },
    orderBy: { dueDate: 'asc' },
  });

  const totalOutstanding = bills
    .filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + b.amountKobo, 0);

  const pendingCount = bills.filter((b) => b.status === 'PENDING').length;
  const overdueCount = bills.filter((b) => b.status === 'OVERDUE').length;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payments</h1>

      <BalanceCard
        totalKobo={totalOutstanding}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
      />

      {bills.length > 0 ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Receipt size={16} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Bill History</span>
          </div>
          <div className={styles.list}>
            {bills.map((bill) => (
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
                  <span className={styles.billAmount}>{formatKobo(bill.amountKobo)}</span>
                  <div className={styles.billDue}>
                    Due {new Date(bill.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {bill.status === 'PENDING' && (
                  <form action="/api/payments/initialize" method="POST" className={styles.payForm}>
                    <input type="hidden" name="billId" value={bill.id} />
                    <Button size="sm">Pay Now — {formatKobo(bill.amountKobo)}</Button>
                  </form>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>
            <div className={styles.emptyBlob1} />
            <div className={styles.emptyBlob2} />
            <div className={styles.emptyCard}>
              <CreditCard size={32} strokeWidth={1.2} className={styles.emptyCardIcon} />
            </div>
          </div>
          <h2 className={styles.emptyTitle}>No bills yet</h2>
          <p className={styles.emptySubtext}>
            You don&apos;t have any bills right now. When a bill is generated, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

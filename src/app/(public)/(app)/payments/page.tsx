import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BILL_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';

type BillItem = {
  id: string; amountKobo: number; dueDate: Date; periodStart: Date; periodEnd: Date;
  status: string; createdAt: Date; residentId: string;
};

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const bills: BillItem[] = await db.bill.findMany({
    where: { residentId: session.residentId },
    orderBy: { dueDate: 'asc' },
  });

  const totalOutstanding = bills
    .filter((b: BillItem) => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((sum: number, b: BillItem) => sum + b.amountKobo, 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payments</h1>

      <Card className={styles.balanceCard}>
        <p className={styles.balanceLabel}>Outstanding Balance</p>
        <p className={styles.balanceAmount}>₦{(totalOutstanding / 100).toLocaleString()}</p>
      </Card>

      <div className={styles.list}>
        {bills.map((bill) => (
          <Card key={bill.id} className={styles.billCard}>
            <div className={styles.billRow}>
              <div>
                <p className={styles.billPeriod}>
                  {new Date(bill.periodStart).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(bill.periodEnd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className={styles.billAmount}>₦{(bill.amountKobo / 100).toLocaleString()}</p>
              </div>
              <div className={styles.billRight}>
                <span className={`${styles.status} ${styles[bill.status.toLowerCase()]}`}>
                  {BILL_STATUS_LABELS[bill.status]}
                </span>
                {bill.status === 'PENDING' && (
                  <form action="/api/payments/initialize" method="POST">
                    <input type="hidden" name="billId" value={bill.id} />
                    <Button size="sm">Pay Now</Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ))}
        {bills.length === 0 && (
          <p className={styles.empty}>No bills found.</p>
        )}
      </div>
    </div>
  );
}

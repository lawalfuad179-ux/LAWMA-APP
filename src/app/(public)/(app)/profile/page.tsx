import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/ui/LogoutButton';
import styles from './page.module.css';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [resident, complaintCount, paymentSummary, pspOperator] = await Promise.all([
    db.resident.findUnique({ where: { id: session.residentId } }),
    db.complaint.count({ where: { residentId: session.residentId } }),
    db.payment.aggregate({
      where: { residentId: session.residentId, status: 'SUCCESSFUL' },
      _sum: { amountKobo: true },
    }),
    db.pspOperator.findFirst({ where: { lga: (await db.resident.findUnique({ where: { id: session.residentId } }))?.lga || '' } }),
  ]);

  if (!resident) redirect('/login');

  const totalPaid = paymentSummary._sum.amountKobo || 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <Card className={styles.card}>
        <div className={styles.avatar}>
          {resident.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span className={styles.value}>{resident.name || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Phone</span>
          <span className={styles.value}>{resident.phoneNumber}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>LGA</span>
          <span className={styles.value}>{resident.lga || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Address</span>
          <span className={styles.value}>{resident.address || 'Not set'}</span>
        </div>
      </Card>

      {pspOperator ? (
        <Card className={styles.card}>
          <h2 className={styles.sectionTitle}>Assigned PSP Operator</h2>
          <div className={styles.row}>
            <span className={styles.label}>Name</span>
            <span className={styles.value}>{pspOperator.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Zone</span>
            <span className={styles.value}>{pspOperator.zone}</span>
          </div>
        </Card>
      ) : null}

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Activity Summary</h2>
        <div className={styles.row}>
          <span className={styles.label}>Complaints Filed</span>
          <span className={styles.value}>{complaintCount}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Total Paid</span>
          <span className={styles.value}>₦{(totalPaid / 100).toLocaleString()}</span>
        </div>
      </Card>

      <div className={styles.links}>
        <a href="/notifications" className={styles.link}>Notification Preferences</a>
      </div>

      <LogoutButton />
    </div>
  );
}

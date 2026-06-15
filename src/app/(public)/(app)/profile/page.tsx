import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Truck, BarChart3, Bell } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
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
    db.pspOperator.findFirst({
      where: { lga: (await db.resident.findUnique({ where: { id: session.residentId } }))?.lga || '' },
    }),
  ]);

  if (!resident) redirect('/login');

  const totalPaid = paymentSummary._sum.amountKobo || 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <Card className={styles.card}>
        <div className={styles.avatarRow}>
          <AvatarUpload name={resident.name || ''} avatarUrl={resident.avatarUrl} />
          <div className={styles.avatarMeta}>
            <span className={styles.avatarName}>{resident.name || 'Resident'}</span>
            <span className={styles.avatarPhone}>{resident.phoneNumber}</span>
          </div>
        </div>

        <ProfileEditForm
          initialName={resident.name || ''}
          initialAddress={resident.address || ''}
          initialLga={resident.lga || ''}
          initialEmail={resident.email || ''}
          initialPhone={resident.phoneNumber || ''}
        />
      </Card>

      {pspOperator ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Truck size={16} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Assigned PSP Operator</span>
          </div>
          <Card className={styles.card}>
            <div className={styles.row}>
              <span className={styles.label}>Name</span>
              <span className={styles.value}>{pspOperator.name}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Zone</span>
              <span className={styles.value}>{pspOperator.zone}</span>
            </div>
          </Card>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <BarChart3 size={16} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Activity Summary</span>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Complaints Filed</span>
            <span className={styles.value}>{complaintCount}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Total Paid</span>
            <span className={styles.value}>₦{(totalPaid / 100).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      <div className={styles.links}>
        <Link href="/notifications/preferences" className={styles.link}>
          <Bell size={16} strokeWidth={1.5} />
          Notification Preferences
        </Link>
      </div>

      <div className={styles.signOutRow}>
        <LogoutButton variant="danger" />
      </div>
    </div>
  );
}

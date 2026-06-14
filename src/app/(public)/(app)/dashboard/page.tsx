import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CreditCard } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DAYS_OF_WEEK, COMPLAINT_STATUS_LABELS, NOTIFICATION_TYPE_LABELS, RECYCLING_TIPS } from '@/constants';
import styles from './page.module.css';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({ where: { id: session.residentId } });
  if (!resident) redirect('/login');
  if (!(resident.name && resident.address && resident.lga)) redirect('/onboarding');

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const today = now.getDay();
  const todaySchedules = await db.collectionSchedule.findMany({
    where: { lga: resident.lga, dayOfWeek: today },
    include: { pspOperator: true },
  });
  const todaySchedule = todaySchedules[0];

  const activeComplaints = await db.complaint.findMany({
    where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  const latestActive = activeComplaints[0];

  const notifications = await db.notification.findMany({
    where: { residentId: session.residentId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const recyclingTip = RECYCLING_TIPS[Math.floor(Math.random() * RECYCLING_TIPS.length)];

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <span className={styles.greetingText}>{greeting}, {resident.name?.split(' ')[0]}</span>
        <span className={styles.location}>{resident.lga}</span>
      </div>

      {todaySchedule ? (
        <Card className={styles.pickupCard}>
          <div className={styles.pickupTop}>
            <span className={styles.pickupLabel}>Next Pickup</span>
            <Badge label={todaySchedule.status} variant="success" />
          </div>
          <span className={styles.pickupDay}>Today</span>
          <span className={styles.pickupTime}>{todaySchedule.windowStart} – {todaySchedule.windowEnd}</span>
          <span className={styles.pickupPsp}>{todaySchedule.pspOperator.name}</span>
        </Card>
      ) : (
        <Link href="/schedules" className={styles.scheduleLink}>
          View collection schedule
        </Link>
      )}

      <div className={styles.actions}>
        <Link href="/complaints/report" className={styles.actionButton}>
          <AlertCircle size={20} strokeWidth={1.5} />
          Report Issue
        </Link>
        <Link href="/payments" className={styles.actionButton}>
          <CreditCard size={20} strokeWidth={1.5} />
          Pay Bill
        </Link>
      </div>

      {latestActive ? (
        <Link href={`/complaints/${latestActive.id}`} className={styles.complaintLink}>
          <Card className={styles.complaintCard}>
            <div className={styles.complaintTop}>
              <span className={styles.complaintType}>{latestActive.issueType.replace(/_/g, ' ')}</span>
              <Badge label={COMPLAINT_STATUS_LABELS[latestActive.status]} variant="warning" />
            </div>
            <span className={styles.complaintAddress}>{latestActive.address}</span>
          </Card>
        </Link>
      ) : null}

      {notifications.length > 0 ? (
        <div className={styles.notifSection}>
          <span className={styles.sectionTitle}>Recent Notifications</span>
          {notifications.map((n) => (
            <Link key={n.id} href="/notifications" className={styles.notifLink}>
              <div className={styles.notifItem}>
                <div className={styles.notifTop}>
                  <span className={styles.notifType}>{NOTIFICATION_TYPE_LABELS[n.type] || n.type}</span>
                  {!n.isRead ? <span className={styles.notifDot} /> : null}
                </div>
                <span className={styles.notifTitle}>{n.title}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <div className={styles.tip}>
        <span className={styles.tipCategory}>{recyclingTip.category}</span>
        <span className={styles.tipTitle}>{recyclingTip.title}</span>
        <span className={styles.tipDesc}>{recyclingTip.description}</span>
      </div>
    </div>
  );
}

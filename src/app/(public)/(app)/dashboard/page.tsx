import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CreditCard, CalendarDays, Leaf, TriangleAlert } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { COMPLAINT_STATUS_LABELS, NOTIFICATION_TYPE_LABELS, RECYCLING_TIPS, DAYS_OF_WEEK, COLLECTION_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';

async function getNextSchedule(lga: string) {
  const schedules = await db.collectionSchedule.findMany({
    where: { lga },
    include: { pspOperator: true },
  });
  if (schedules.length === 0) return null;

  const today = new Date().getDay();
  let best: (typeof schedules)[number] | null = null;
  let bestOffset = Infinity;

  for (const s of schedules) {
    let offset = s.dayOfWeek - today;
    if (offset < 0) offset += 7;
    if (offset < bestOffset) {
      bestOffset = offset;
      best = s;
    }
  }

  if (!best) return null;
  return { schedule: best, dayOffset: bestOffset };
}

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({ where: { id: session.residentId } });
  if (!resident) redirect('/login');

  const isProfileIncomplete = !resident.name || !resident.address || !resident.lga;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const initial = resident.name?.charAt(0)?.toUpperCase() || '?';
  const avatarUrl = resident.avatarUrl;

  const nextSchedule = resident.lga ? await getNextSchedule(resident.lga) : null;

  const activeComplaintsCount = await db.complaint.count({
    where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
  });
  const overdueBillsCount = await db.bill.count({
    where: { residentId: session.residentId, status: 'OVERDUE' },
  });

  const pendingBill = await db.bill.findFirst({
    where: { residentId: session.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
    orderBy: { dueDate: 'asc' },
  });

  const latestActiveComplaint = await db.complaint.findFirst({
    where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
    orderBy: { createdAt: 'desc' },
  });

  const notifications = await db.notification.findMany({
    where: { residentId: session.residentId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const tipIndex = now.getDate() % RECYCLING_TIPS.length;
  const recyclingTip = RECYCLING_TIPS[tipIndex];

  return (
    <div className={styles.page}>
      <DashboardClient
        isProfileIncomplete={isProfileIncomplete}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          typeLabel: NOTIFICATION_TYPE_LABELS[n.type] || n.type,
        }))}
      />

      <div className={styles.greetingSection}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            initial
          )}
        </div>
        <div className={styles.greetingTexts}>
          <span className={styles.greetingText}>{greeting}, {resident.name?.split(' ')[0]}</span>
          {resident.lga && <span className={styles.location}>{resident.lga}</span>}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <CalendarDays size={16} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Collection Schedule</span>
        </div>
        {nextSchedule ? (
          <Link href="/schedules" className={styles.cardLink}>
            <Card className={styles.pickupCard}>
              <div className={styles.pickupTop}>
                <span className={styles.pickupLabel}>Next Pickup</span>
                <Badge
                  label={COLLECTION_STATUS_LABELS[nextSchedule.schedule.status]}
                  variant={
                    nextSchedule.schedule.status === 'SCHEDULED' ? 'success' :
                    nextSchedule.schedule.status === 'DELAYED' ? 'warning' :
                    nextSchedule.schedule.status === 'MISSED' ? 'error' : 'neutral'
                  }
                />
              </div>
              <span className={styles.pickupDay}>
                {nextSchedule.dayOffset === 0 ? 'Today' : nextSchedule.dayOffset === 1 ? 'Tomorrow' : DAYS_OF_WEEK[nextSchedule.schedule.dayOfWeek]}
              </span>
              <span className={styles.pickupTime}>{nextSchedule.schedule.windowStart} – {nextSchedule.schedule.windowEnd}</span>
              <span className={styles.pickupPsp}>{nextSchedule.schedule.pspOperator.name}</span>
            </Card>
          </Link>
        ) : (
          <Link href="/schedules" className={styles.scheduleLink}>
            <CalendarDays size={16} strokeWidth={1.5} />
            View available schedules
          </Link>
        )}
      </div>

      <div className={styles.statsRow}>
        <Link href="/complaints" className={styles.stat}>
          <span className={styles.statValue}>{activeComplaintsCount}</span>
          <span className={styles.statLabel}>Active {activeComplaintsCount === 1 ? 'complaint' : 'complaints'}</span>
        </Link>
        <Link href="/payments" className={`${styles.stat} ${overdueBillsCount > 0 ? styles.statOverdue : ''}`}>
          <span className={styles.statValue}>{overdueBillsCount}</span>
          <span className={styles.statLabel}>Overdue {overdueBillsCount === 1 ? 'bill' : 'bills'}</span>
        </Link>
      </div>

      {pendingBill ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <CreditCard size={16} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Outstanding Bill</span>
          </div>
          <Link href="/payments" className={styles.cardLink}>
            <Card className={styles.billCard}>
              <div className={styles.pickupTop}>
                <span className={styles.pickupLabel}>Amount Due</span>
                <Badge
                  label={pendingBill.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                  variant={pendingBill.status === 'OVERDUE' ? 'error' : 'warning'}
                />
              </div>
              <span className={styles.billAmount}>{formatKobo(pendingBill.amountKobo)}</span>
              <span className={styles.pickupTime}>
                Due {new Date(pendingBill.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </Card>
          </Link>
        </div>
      ) : null}

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

      {latestActiveComplaint ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <TriangleAlert size={16} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Active Report</span>
          </div>
          <Link href={`/complaints/${latestActiveComplaint.id}`} className={styles.cardLink}>
            <Card className={styles.complaintCard}>
              <div className={styles.complaintTop}>
                <span className={styles.complaintType}>{latestActiveComplaint.issueType.replace(/_/g, ' ')}</span>
                <Badge label={COMPLAINT_STATUS_LABELS[latestActiveComplaint.status]} variant="warning" />
              </div>
              <span className={styles.complaintAddress}>{latestActiveComplaint.address}</span>
            </Card>
          </Link>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Leaf size={16} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Recycling Tip</span>
        </div>
        <div className={styles.tipCard}>
          <span className={styles.tipCategory}>{recyclingTip.category}</span>
          <span className={styles.tipTitle}>{recyclingTip.title}</span>
          <span className={styles.tipDesc}>{recyclingTip.description}</span>
        </div>
      </div>
    </div>
  );
}

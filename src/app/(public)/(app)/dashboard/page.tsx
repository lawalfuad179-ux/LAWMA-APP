import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CreditCard, CalendarDays, Leaf, Bell } from 'lucide-react';
import Image from 'next/image';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardActivity } from '@/components/dashboard/DashboardActivity';
import { COMPLAINT_STATUS_LABELS, PAYMENT_STATUS_LABELS, RECYCLING_TIPS, DAYS_OF_WEEK, COLLECTION_STATUS_LABELS } from '@/constants';
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
  const firstName = resident.name?.split(' ')[0] || 'there';
  const initial = resident.name?.charAt(0)?.toUpperCase() || '?';
  const avatarUrl = resident.avatarUrl;

  const [
    nextScheduleResult,
    activeComplaintsCount,
    overdueBillsCount,
    pendingBill,
    recentComplaints,
    recentPayments,
    unreadCount,
  ] = await Promise.all([
    resident.lga ? getNextSchedule(resident.lga) : null,
    db.complaint.count({
      where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
    }),
    db.bill.count({
      where: { residentId: session.residentId, status: 'OVERDUE' },
    }),
    db.bill.findFirst({
      where: { residentId: session.residentId, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    }),
    db.complaint.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.payment.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.notification.count({
      where: { residentId: session.residentId, isRead: false },
    }),
  ]);

  const nextSchedule = nextScheduleResult;

  const activities = [
    ...recentComplaints.map((c) => ({
      kind: 'complaint' as const,
      id: c.id,
      title: c.issueType.replace(/_/g, ' '),
      subtitle: `${c.createdAt.toLocaleDateString('en-NG')} · ${c.address}`,
      status: COMPLAINT_STATUS_LABELS[c.status] || c.status,
      date: c.createdAt,
    })),
    ...recentPayments.map((p) => ({
      kind: 'payment' as const,
      id: p.id,
      title: `Waste bill paid — ${p.createdAt.toLocaleString('en-NG', { month: 'long' })}`,
      subtitle: `${p.createdAt.toLocaleDateString('en-NG')} · ${formatKobo(p.amountKobo)}`,
      status: p.status === 'SUCCESSFUL' ? 'Confirmed' : (PAYMENT_STATUS_LABELS[p.status] || p.status),
      date: p.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);

  const tipIndex = now.getDate() % RECYCLING_TIPS.length;
  const recyclingTip = RECYCLING_TIPS[tipIndex];

  return (
    <div className={styles.page}>
      <DashboardClient isProfileIncomplete={isProfileIncomplete} />

      {/* Desktop topbar — hidden on mobile */}
      <div className={styles.desktopTopbar}>
        <div className={styles.desktopGreetingBlock}>
          <span className={styles.desktopGreeting}>{greeting}, {firstName}</span>
          {resident.lga && <span className={styles.desktopLocation}>{resident.lga} · Lagos</span>}
        </div>
        <Link href="/notifications" className={styles.topbarBell} aria-label="Notifications">
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className={styles.topbarBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
      </div>

      {/* Mobile greeting — hidden on desktop */}
      <div className={styles.greetingSection}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={44} height={44} className={styles.avatarImg} />
          ) : (
            initial
          )}
        </div>
        <div className={styles.greetingTexts}>
          <span className={styles.greetingText}>{greeting}, {firstName}</span>
          {resident.lga && <span className={styles.location}>{resident.lga}</span>}
        </div>
      </div>

      {/* 2-column content grid */}
      <div className={styles.contentGrid}>
        {/* Left: Collection Schedule */}
        <div className={styles.gridLeft}>
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
                    <span
                      className={
                        nextSchedule.schedule.status === 'SCHEDULED'
                          ? styles.scheduledPill
                          : styles.statusPill
                      }
                      data-status={nextSchedule.schedule.status}
                    >
                      {COLLECTION_STATUS_LABELS[nextSchedule.schedule.status]}
                    </span>
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

          {/* Outstanding Bill (left column on desktop) */}
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
        </div>

        {/* Right: Quick actions + stats */}
        <div className={styles.gridRight}>
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
        </div>
      </div>

      {/* Recent Activity feed */}
      <div className={styles.activitySection}>
        <DashboardActivity activities={activities} />
      </div>

      {/* Recycling Tip */}
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

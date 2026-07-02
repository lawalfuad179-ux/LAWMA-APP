import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CreditCard, CalendarDays, Leaf, ArrowRight } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardActivity } from '@/components/dashboard/DashboardActivity';
import { ProfileCompletionCard } from '@/components/dashboard/ProfileCompletionCard';
import { Reveal } from '@/components/ui/Reveal';
import type { ActivityItem } from '@/components/activity/types';
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

  const resident = await db.resident.findUnique({
    where: { id: session.residentId },
    select: { name: true, lga: true, avatarUrl: true, address: true, email: true, phoneNumber: true },
  });
  if (!resident) redirect('/login');

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = resident.name?.split(' ')[0] || 'there';

  const [
    nextScheduleResult,
    activeComplaintsCount,
    overdueBillsCount,
    recentComplaints,
    recentPayments,
    recentBinOrders,
    unreadCount,
  ] = await Promise.all([
    resident.lga ? getNextSchedule(resident.lga) : null,
    db.complaint.count({
      where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
    }),
    db.bill.count({
      where: { residentId: session.residentId, status: 'OVERDUE' },
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
      include: { bill: { select: { periodStart: true, periodEnd: true, discountKobo: true } } },
    }),
    db.binOrder.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.notification.count({
      where: { residentId: session.residentId, isRead: false },
    }),
  ]);

  const nextSchedule = nextScheduleResult;

  const activities: ActivityItem[] = [
    ...recentComplaints.map((c) => ({
      kind: 'complaint' as const,
      id: c.id,
      title: c.issueType.replace(/_/g, ' '),
      subtitle: `${c.createdAt.toLocaleDateString('en-NG')} · ${c.address}`,
      status: COMPLAINT_STATUS_LABELS[c.status] || c.status,
      date: c.createdAt,
      complaint: {
        ticketId: c.ticketId,
        issueType: c.issueType,
        lga: c.lga,
        area: c.area,
        address: c.address,
        description: c.description,
      },
    })),
    ...recentPayments.map((p) => ({
      kind: 'payment' as const,
      id: p.id,
      title: `Waste bill paid — ${p.createdAt.toLocaleString('en-NG', { month: 'long' })}`,
      subtitle: `${p.createdAt.toLocaleDateString('en-NG')} · ${formatKobo(p.amountKobo)}`,
      status: p.status === 'SUCCESSFUL' ? 'Confirmed' : (PAYMENT_STATUS_LABELS[p.status] || p.status),
      date: p.createdAt,
      payment: {
        billId: p.billId,
        amountKobo: p.amountKobo,
        discountKobo: p.bill.discountKobo,
        paidAt: p.paidAt,
        periodStart: p.bill.periodStart,
        periodEnd: p.bill.periodEnd,
        receiptNumber: p.receiptNumber,
        txRef: p.txRef,
        rawStatus: p.status,
      },
    })),
    ...recentBinOrders.map((o) => ({
      kind: 'bin_order' as const,
      id: o.id,
      title: `${o.binLabel} ordered`,
      subtitle: `${o.createdAt.toLocaleDateString('en-NG')} · ${o.quantity} bin${o.quantity !== 1 ? 's' : ''} · ${formatKobo(o.amountKobo)}`,
      status: o.status === 'SUCCESSFUL' ? 'Confirmed' : (PAYMENT_STATUS_LABELS[o.status] || o.status),
      date: o.createdAt,
      binOrder: {
        binLabel: o.binLabel,
        binType: o.binType,
        quantity: o.quantity,
        amountKobo: o.amountKobo,
        deliveryAddress: o.deliveryAddress,
        txRef: o.txRef,
        rawStatus: o.status,
      },
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);

  const tipIndex = now.getDate() % RECYCLING_TIPS.length;
  const recyclingTip = RECYCLING_TIPS[tipIndex];

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardContent}>
        <ProfileCompletionCard
          name={resident.name}
          lga={resident.lga}
          address={resident.address}
          email={resident.email}
          phoneNumber={resident.phoneNumber}
        />

        {/* User greeting row — visible on all screen sizes */}
        <Link href="/profile" className={styles.mobileUserRow}>
          <div className={styles.mobileUserAvatar}>
            {resident.avatarUrl
              ? <img src={resident.avatarUrl} alt="" className={styles.mobileUserAvatarImg} />
              : <span className={styles.mobileUserAvatarInitial}>{firstName.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className={styles.mobileUserMeta}>
            <h1 className={styles.mobileGreeting}>{greeting}, {firstName}</h1>
            {resident.lga && <p className={styles.mobileLocation}>{resident.lga} · Lagos</p>}
          </div>
        </Link>
        {/* Collection Schedule */}
        <Reveal className={styles.dashboardSection} delay={0.04} immediate>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>
              <CalendarDays size={16} strokeWidth={1.5} />
              <span>Collection Schedule</span>
            </div>
            <Link href="/schedules" className={styles.sectionAction}>
              View schedule <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          <div className={styles.collectionGrid}>
            {/* Left: Pickup card */}
            <div>
              {nextSchedule ? (
                <div className={styles.pickupCard}>
                  <div className={styles.pickupCardTop}>
                    <span className={styles.pickupLabel}>Next Pickup</span>
                    <span
                      className={
                        nextSchedule.schedule.status === 'SCHEDULED'
                          ? styles.scheduledPill
                          : styles.statusPill
                      }
                    >
                      {COLLECTION_STATUS_LABELS[nextSchedule.schedule.status]}
                    </span>
                  </div>
                  <div>
                    <p className={styles.pickupDay}>
                      {nextSchedule.dayOffset === 0 ? 'Today' : nextSchedule.dayOffset === 1 ? 'Tomorrow' : DAYS_OF_WEEK[nextSchedule.schedule.dayOfWeek]}
                    </p>
                    <p className={styles.pickupMeta}>
                      {nextSchedule.schedule.windowStart} – {nextSchedule.schedule.windowEnd} · {nextSchedule.schedule.pspOperator.name}
                    </p>
                  </div>
                </div>
              ) : (
                <Link href="/schedules" className={styles.scheduleLink}>
                  <CalendarDays size={16} strokeWidth={1.5} />
                  View available schedules
                </Link>
              )}
            </div>

            {/* Right: Quick action + stat cards */}
            <div className={styles.quickGrid}>
              <div className={styles.fillContainer}>
                <Link href="/complaints/report" className={styles.quickActionCard}>
                  <AlertCircle size={24} strokeWidth={1.5} />
                  Report Issue
                </Link>
                <Link href="/payments" className={styles.quickActionCard}>
                  <CreditCard size={24} strokeWidth={1.5} />
                  Pay Bill
                </Link>
              </div>
              <div className={styles.fillContainer}>
                <Link href="/complaints" className={styles.statCard}>
                  <span className={styles.statValue}>{activeComplaintsCount}</span>
                  <span className={styles.statLabel}>Active {activeComplaintsCount === 1 ? 'complaint' : 'complaints'}</span>
                </Link>
                <Link href="/payments" className={styles.statCard}>
                  <span className={styles.statValue}>{overdueBillsCount}</span>
                  <span className={styles.statLabel}>Overdue {overdueBillsCount === 1 ? 'bill' : 'bills'}</span>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Recent Activity */}
        <Reveal className={styles.dashboardSection} delay={0.1} immediate>
          <DashboardActivity activities={activities} />
        </Reveal>

        {/* Recycling Tip */}
        <Reveal className={styles.dashboardSection} delay={0.16}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>
              <Leaf size={16} strokeWidth={1.5} />
              <span>Recycling Tip</span>
            </div>
          </div>
          <div className={styles.tipCard}>
            <span className={styles.tipCategory}>{recyclingTip.category}</span>
            <h3 className={styles.tipTitle}>{recyclingTip.title}</h3>
            <p className={styles.tipDesc}>{recyclingTip.description}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

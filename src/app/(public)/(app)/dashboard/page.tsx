import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { DAYS_OF_WEEK } from '@/constants';
import styles from './page.module.css';

function ScheduleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

function RecycleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({
    where: { id: session.residentId },
  });
  if (!resident) redirect('/login');

  if (!(resident.name && resident.address && resident.lga)) {
    redirect('/onboarding');
  }

  const today = new Date().getDay();

  const [todaySchedules, activeComplaints, bills] = await Promise.all([
    db.collectionSchedule.findMany({
      where: { lga: resident.lga },
      include: { pspOperator: true },
    }),
    db.complaint.count({
      where: { residentId: session.residentId, status: { not: 'RESOLVED' } },
    }),
    db.bill.findMany({
      where: { residentId: session.residentId },
      orderBy: { dueDate: 'desc' },
      take: 10,
    }),
  ]);

  const todayPickup = todaySchedules.find((s) => s.dayOfWeek === today);
  const totalOutstanding = bills
    .filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + b.amountKobo, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.greetingRow}>
          <div className={styles.avatar}>
            {resident.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className={styles.greeting}>Good day, {resident.name?.split(' ')[0]}</h1>
            <p className={styles.location}>{resident.lga}</p>
          </div>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${styles.statPositive}`}>
            {todayPickup ? DAYS_OF_WEEK[todayPickup.dayOfWeek] : '--'}
          </div>
          <div className={styles.statLabel}>Next pickup</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${activeComplaints > 0 ? styles.statWarning : styles.statMuted}`}>
            {activeComplaints}
          </div>
          <div className={styles.statLabel}>Active issues</div>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${totalOutstanding > 0 ? styles.statWarning : styles.statPositive}`}>
            ₦{(totalOutstanding / 100).toLocaleString()}
          </div>
          <div className={styles.statLabel}>Due</div>
        </div>
      </div>

      <div className={styles.grid}>
        <Link href="/schedules" className={styles.card}>
          <div className={styles.cardIcon}><ScheduleIcon /></div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Collection Schedule</span>
            <span className={styles.cardDesc}>View pickup days and operator</span>
          </div>
        </Link>
        <Link href="/complaints" className={styles.card}>
          <div className={styles.cardIcon}><AlertIcon /></div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Report an Issue</span>
            <span className={styles.cardDesc}>Photo and location tracking</span>
          </div>
        </Link>
        <Link href="/payments" className={styles.card}>
          <div className={styles.cardIcon}><CreditCardIcon /></div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Pay Waste Bill</span>
            <span className={styles.cardDesc}>Digital payments via Flutterwave</span>
          </div>
        </Link>
        <Link href="/recycling" className={styles.card}>
          <div className={styles.cardIcon}><RecycleIcon /></div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Recycling Guide</span>
            <span className={styles.cardDesc}>Learn how to sort waste</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

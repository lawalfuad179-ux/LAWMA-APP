import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { COMPLAINT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';
import activityStyles from '@/components/dashboard/DashboardActivity.module.css';

type ActivityKind = 'complaint' | 'payment' | 'bin_order';

type ActivityItem = {
  kind: ActivityKind;
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: Date;
};

const ACTIVITY_HREF: Record<ActivityKind, (id: string) => string> = {
  complaint: (id) => `/complaints/${id}`,
  payment: () => '/payments',
  bin_order: () => '/smart-bins',
};

const FILTERS: { value: ActivityKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'complaint', label: 'Reports' },
  { value: 'payment', label: 'Payments' },
  { value: 'bin_order', label: 'Bin Orders' },
];

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusClass(status: string): string {
  if (['Confirmed', 'Resolved', 'SUCCESSFUL'].includes(status)) return activityStyles.badgeConfirmed;
  if (['In Review', 'IN_REVIEW'].includes(status)) return activityStyles.badgeReview;
  if (['Submitted', 'SUBMITTED'].includes(status)) return activityStyles.badgeSubmitted;
  return activityStyles.badgeNeutral;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { type } = await searchParams;
  const activeFilter: ActivityKind | 'all' =
    type === 'complaint' || type === 'payment' || type === 'bin_order' ? type : 'all';

  const [complaints, payments, binOrders] = await Promise.all([
    db.complaint.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.payment.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.binOrder.findMany({
      where: { residentId: session.residentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  const activities: ActivityItem[] = [
    ...complaints.map((c) => ({
      kind: 'complaint' as const,
      id: c.id,
      title: c.issueType.replace(/_/g, ' '),
      subtitle: `${c.createdAt.toLocaleDateString('en-NG')} · ${c.address}`,
      status: COMPLAINT_STATUS_LABELS[c.status] || c.status,
      date: c.createdAt,
    })),
    ...payments.map((p) => ({
      kind: 'payment' as const,
      id: p.id,
      title: `Waste bill paid — ${p.createdAt.toLocaleString('en-NG', { month: 'long' })}`,
      subtitle: `${p.createdAt.toLocaleDateString('en-NG')} · ${formatKobo(p.amountKobo)}`,
      status: p.status === 'SUCCESSFUL' ? 'Confirmed' : (PAYMENT_STATUS_LABELS[p.status] || p.status),
      date: p.createdAt,
    })),
    ...binOrders.map((o) => ({
      kind: 'bin_order' as const,
      id: o.id,
      title: `${o.binLabel} ordered`,
      subtitle: `${o.createdAt.toLocaleDateString('en-NG')} · ${o.quantity} bin${o.quantity !== 1 ? 's' : ''} · ${formatKobo(o.amountKobo)}`,
      status: o.status === 'SUCCESSFUL' ? 'Confirmed' : (PAYMENT_STATUS_LABELS[o.status] || o.status),
      date: o.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);

  const filtered = activeFilter === 'all' ? activities : activities.filter((a) => a.kind === activeFilter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Clock size={20} strokeWidth={1.5} />
        <h1 className={styles.title}>All Activity</h1>
      </div>

      <div className={styles.filterRow}>
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/activities' : `/activities?type=${f.value}`}
            className={`${styles.filterPill} ${activeFilter === f.value ? styles.filterPillActive : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={activityStyles.empty}>No activity yet in this category.</p>
      ) : (
        <div className={activityStyles.activityCard}>
          {filtered.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={ACTIVITY_HREF[item.kind](item.id)}
              className={activityStyles.activityItem}
            >
              <div>
                <p className={activityStyles.activityTitle}>{item.title}</p>
                <p className={activityStyles.activityMeta}>{item.subtitle}</p>
              </div>
              <span className={statusClass(item.status)}>{item.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

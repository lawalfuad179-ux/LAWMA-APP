import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { BackButton } from '@/components/ui/BackButton';
import { ActivityList } from '@/components/activity/ActivityList';
import type { ActivityItem } from '@/components/activity/types';
import { COMPLAINT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';
import activityStyles from '@/components/dashboard/DashboardActivity.module.css';

type ActivityKind = ActivityItem['kind'];

const FILTERS: { value: ActivityKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'complaint', label: 'Reports' },
  { value: 'payment', label: 'Payments' },
  { value: 'bin_order', label: 'Bin Orders' },
];

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      include: { bill: { select: { periodStart: true, periodEnd: true, discountKobo: true } } },
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
      complaint: {
        ticketId: c.ticketId,
        issueType: c.issueType,
        lga: c.lga,
        area: c.area,
        address: c.address,
        description: c.description,
      },
    })),
    ...payments.map((p) => ({
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
    ...binOrders.map((o) => ({
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
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);

  const filtered = activeFilter === 'all' ? activities : activities.filter((a) => a.kind === activeFilter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <BackButton className={styles.back} />
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
        <ActivityList activities={filtered} />
      )}
    </div>
  );
}

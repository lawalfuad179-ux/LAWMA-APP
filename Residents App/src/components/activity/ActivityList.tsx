'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Receipt, Download, X } from 'lucide-react';

import activityStyles from '@/components/dashboard/DashboardActivity.module.css';
import styles from './ActivityList.module.css';
import type { ActivityItem } from './types';

function statusClass(status: string): string {
  if (['Confirmed', 'Resolved', 'SUCCESSFUL'].includes(status)) return activityStyles.badgeConfirmed;
  if (['In Review', 'IN_REVIEW'].includes(status)) return activityStyles.badgeReview;
  if (['Submitted', 'SUBMITTED'].includes(status)) return activityStyles.badgeSubmitted;
  return activityStyles.badgeNeutral;
}

function formatKobo(amountKobo: number) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function downloadHref(item: ActivityItem): string | null {
  if (item.kind === 'complaint') return `/api/complaints/receipt/${item.id}`;
  if (item.kind === 'bin_order') return `/api/bins/receipt/${item.id}`;
  if (item.kind === 'payment' && item.payment.rawStatus === 'SUCCESSFUL') return `/api/payments/receipt/${item.payment.billId}`;
  return null;
}

function receiptRows(item: ActivityItem): [string, string][] {
  if (item.kind === 'complaint') {
    const c = item.complaint;
    return [
      ['Ticket ID', c.ticketId],
      ['Issue Type', c.issueType.replace(/_/g, ' ')],
      ['Date Reported', formatDate(item.date)],
      ['LGA', c.lga],
      ['Area', c.area],
      ['Address', c.address],
      ...(c.description ? ([['Description', c.description]] as [string, string][]) : []),
    ];
  }
  if (item.kind === 'payment') {
    const p = item.payment;
    return [
      ['Bill Period', `${formatDate(p.periodStart)} — ${formatDate(p.periodEnd)}`],
      ['Amount', formatKobo(p.amountKobo)],
      ...(p.discountKobo > 0 ? ([['Reward Discount', `- ${formatKobo(p.discountKobo)}`]] as [string, string][]) : []),
      ['Paid On', p.paidAt ? formatDate(p.paidAt) : '—'],
      ['Reference', p.receiptNumber || p.txRef],
    ];
  }
  const o = item.binOrder;
  return [
    ['Bin', o.binLabel],
    ['Quantity', String(o.quantity)],
    ['Amount', formatKobo(o.amountKobo)],
    ['Date Ordered', formatDate(item.date)],
    ['Delivery Address', o.deliveryAddress],
    ['Reference', o.txRef],
  ];
}

export function ActivityList({ activities }: { activities: ActivityItem[] }) {
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const reduced = useReducedMotion();

  if (activities.length === 0) {
    return <p className={activityStyles.empty}>No activity yet.</p>;
  }

  const href = selected ? downloadHref(selected) : null;

  return (
    <>
      <div className={activityStyles.activityCard}>
        {activities.map((item) => (
          <button
            key={`${item.kind}-${item.id}`}
            type="button"
            className={`${styles.itemBtn} ${activityStyles.activityItem}`}
            onClick={() => setSelected(item)}
          >
            <div>
              <p className={activityStyles.activityTitle}>{item.title}</p>
              <p className={activityStyles.activityMeta}>{item.subtitle}</p>
            </div>
            <span className={statusClass(item.status)}>{item.status}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.header}>
                <div className={styles.headerTitle}>
                  <Receipt size={16} strokeWidth={1.5} />
                  <span>{selected.title}</span>
                </div>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setSelected(null)}
                  aria-label="Cancel"
                >
                  <X size={14} strokeWidth={2} />
                  <span>Cancel</span>
                </button>
              </div>

              <div className={styles.statusRow}>
                <span className={statusClass(selected.status)}>{selected.status}</span>
              </div>

              <div className={styles.rows}>
                {receiptRows(selected).map(([label, value]) => (
                  <div className={styles.row} key={label}>
                    <span className={styles.rowLabel}>{label}</span>
                    <span className={styles.rowValue}>{value}</span>
                  </div>
                ))}
              </div>

              {href && (
                <a href={href} className={styles.downloadBtn}>
                  <Download size={16} strokeWidth={1.8} />
                  Download receipt (PDF)
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import styles from './DashboardActivity.module.css';

type ActivityItem = {
  kind: 'complaint' | 'payment' | 'bin_order';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: Date;
};

const ACTIVITY_HREF: Record<ActivityItem['kind'], (id: string) => string> = {
  complaint: (id) => `/complaints/${id}`,
  payment: () => '/payments',
  bin_order: () => '/smart-bins',
};

type Props = { activities: ActivityItem[] };

function statusClass(status: string): string {
  if (['Confirmed', 'Resolved', 'SUCCESSFUL'].includes(status)) return styles.badgeConfirmed;
  if (['In Review', 'IN_REVIEW'].includes(status)) return styles.badgeReview;
  if (['Submitted', 'SUBMITTED'].includes(status)) return styles.badgeSubmitted;
  return styles.badgeNeutral;
}

export function DashboardActivity({ activities }: Props) {
  // No single page lists every kind together, so "View all" follows
  // whichever kind is most recent — each destination already has its own
  // history section (Bill History, Smart Bins, My Reports).
  const mostRecentKind = activities[0]?.kind ?? 'complaint';
  const viewAllHref = mostRecentKind === 'complaint' ? '/complaints' : mostRecentKind === 'payment' ? '/payments' : '/smart-bins';

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Clock size={16} strokeWidth={1.5} />
          <span className={styles.title}>Recent Activity</span>
        </div>
        {activities.length > 0 && (
          <Link href={viewAllHref} className={styles.viewAll}>
            View all <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        )}
      </div>

      {activities.length === 0 ? (
        <p className={styles.empty}>No recent activity</p>
      ) : (
        <div className={styles.activityCard}>
          {activities.map((item) => (
            <Link
              key={item.id}
              href={ACTIVITY_HREF[item.kind](item.id)}
              className={styles.activityItem}
            >
              <div>
                <p className={styles.activityTitle}>{item.title}</p>
                <p className={styles.activityMeta}>{item.subtitle}</p>
              </div>
              <span className={statusClass(item.status)}>{item.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

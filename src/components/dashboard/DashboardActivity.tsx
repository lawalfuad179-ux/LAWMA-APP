import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import styles from './DashboardActivity.module.css';

type ActivityItem = {
  kind: 'complaint' | 'payment';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: Date;
};

type Props = { activities: ActivityItem[] };

function statusClass(status: string): string {
  if (['Confirmed', 'Resolved', 'SUCCESSFUL'].includes(status)) return styles.badgeConfirmed;
  if (['In Review', 'IN_REVIEW'].includes(status)) return styles.badgeReview;
  if (['Submitted', 'SUBMITTED'].includes(status)) return styles.badgeSubmitted;
  return styles.badgeNeutral;
}

export function DashboardActivity({ activities }: Props) {
  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Clock size={16} strokeWidth={1.5} />
          <span className={styles.title}>Recent Activity</span>
        </div>
        <Link href="/complaints" className={styles.viewAll}>
          View all <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className={styles.empty}>No recent activity</p>
      ) : (
        <div className={styles.activityCard}>
          {activities.map((item) => (
            <Link
              key={item.id}
              href={item.kind === 'complaint' ? `/complaints/${item.id}` : '/payments'}
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

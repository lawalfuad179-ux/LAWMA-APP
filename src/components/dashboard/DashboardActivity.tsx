import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
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
  if (status === 'In Review') return styles.badgeReview;
  if (status === 'Submitted') return styles.badgeSubmitted;
  return styles.badgeNeutral;
}

export function DashboardActivity({ activities }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Clock size={14} strokeWidth={1.5} />
          <span className={styles.title}>Recent Activity</span>
        </div>
        <Link href="/complaints" className={styles.viewAll}>View all</Link>
      </div>

      {activities.length === 0 ? (
        <p className={styles.empty}>No recent activity</p>
      ) : (
        <div className={styles.list}>
          {activities.map((item) => (
            <Link
              key={item.id}
              href={item.kind === 'complaint' ? `/complaints/${item.id}` : '/payments'}
              className={styles.itemLink}
            >
              <Card className={styles.item}>
                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemSub}>{item.subtitle}</span>
                </div>
                <span className={statusClass(item.status)}>{item.status}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

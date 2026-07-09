import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

import { ActivityList } from '@/components/activity/ActivityList';
import type { ActivityItem } from '@/components/activity/types';
import styles from './DashboardActivity.module.css';

type Props = { activities: ActivityItem[] };

export function DashboardActivity({ activities }: Props) {
  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Clock size={16} strokeWidth={1.5} />
          <span className={styles.title}>Recent Activity</span>
        </div>
        {activities.length > 0 && (
          <Link href="/activities" className={styles.viewAll}>
            View all <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        )}
      </div>

      {activities.length === 0 ? (
        <p className={styles.empty}>No recent activity</p>
      ) : (
        <ActivityList activities={activities} />
      )}
    </div>
  );
}

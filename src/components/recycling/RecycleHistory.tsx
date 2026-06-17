'use client';

import { useEffect, useState } from 'react';
import { Leaf, Star, Clock } from 'lucide-react';

import styles from './RecycleHistory.module.css';

type Activity = {
  id: string;
  imageUrl: string;
  aiReport: {
    summary: string;
    recyclableCount: number;
    nonRecyclableCount: number;
  };
  pointsEarned: number;
  createdAt: string;
};

export function RecycleHistory() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recycle/history')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setActivities(json.data.activities);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <span>Loading history…</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        <Leaf size={32} strokeWidth={1.5} className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>No scans yet</p>
        <p className={styles.emptyDesc}>Scan your first bag of trash to start earning recycling points.</p>
      </div>
    );
  }

  const totalPoints = activities.reduce((sum, a) => sum + a.pointsEarned, 0);

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum}>{activities.length}</span>
          <span className={styles.summaryLabel}>Scans</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum}>{totalPoints}</span>
          <span className={styles.summaryLabel}>Total Points</span>
        </div>
      </div>

      <div className={styles.list}>
        {activities.map((activity) => (
          <div key={activity.id} className={styles.card}>
            <img src={activity.imageUrl} alt="Recycled waste" className={styles.cardImg} />
            <div className={styles.cardBody}>
              <p className={styles.cardSummary}>{activity.aiReport.summary}</p>
              <div className={styles.cardMeta}>
                <span className={styles.cardRecyclable}>
                  <Leaf size={12} />
                  {activity.aiReport.recyclableCount} recyclable
                </span>
                <span className={styles.cardPoints}>
                  <Star size={12} />
                  +{activity.pointsEarned} pts
                </span>
              </div>
              <span className={styles.cardDate}>
                <Clock size={11} />
                {new Date(activity.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

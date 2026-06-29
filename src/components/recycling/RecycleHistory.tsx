'use client';

import { useEffect, useState } from 'react';
import { Leaf, Recycle, Clock } from 'lucide-react';

import styles from './RecycleHistory.module.css';

type Activity = {
  id: string;
  imageUrl: string;
  aiReport: {
    summary: string;
    recyclableCount: number;
    nonRecyclableCount: number;
  };
  createdAt: string;
};

export function RecycleHistory() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    fetch('/api/recycle/history')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setActivities(json.data.activities ?? []);
        } else {
          setApiError(true);
        }
      })
      .catch(() => setApiError(true))
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

  if (apiError) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}>
          <div className={styles.emptyBlob1} />
          <div className={styles.emptyBlob2} />
          <div className={styles.emptyCard}>
            <Clock size={36} strokeWidth={1.2} className={styles.emptyCardIcon} />
          </div>
        </div>
        <h2 className={styles.emptyTitle}>Couldn&apos;t load history</h2>
        <p className={styles.emptyDesc}>There was a problem loading your scan history. Please try again later.</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}>
          <div className={styles.emptyBlob1} />
          <div className={styles.emptyBlob2} />
          <div className={styles.emptyCard}>
            <Clock size={36} strokeWidth={1.2} className={styles.emptyCardIcon} />
          </div>
        </div>
        <h2 className={styles.emptyTitle}>No scans yet</h2>
        <p className={styles.emptyDesc}>Scan your first bag of trash to see your recycling impact.</p>
      </div>
    );
  }

  const totalRecyclable = activities.reduce((sum, a) => sum + a.aiReport.recyclableCount, 0);

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum}>{activities.length}</span>
          <span className={styles.summaryLabel}>Scans</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryNum}>{totalRecyclable}</span>
          <span className={styles.summaryLabel}>Items Recycled</span>
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
                <span className={styles.cardRecyclable}>
                  <Recycle size={12} />
                  {activity.aiReport.nonRecyclableCount} non-recyclable
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

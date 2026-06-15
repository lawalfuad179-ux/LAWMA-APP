'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, CircleCheck, Bell } from 'lucide-react';
import styles from './DashboardClient.module.css';

type NotifItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  typeLabel: string;
};

type Props = {
  isProfileIncomplete: boolean;
  notifications: NotifItem[];
};

export function DashboardClient({ isProfileIncomplete, notifications }: Props) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [localNotifs, setLocalNotifs] = useState(notifications);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const handleMarkRead = async (id: string) => {
    if (markingIds.has(id)) return;
    setMarkingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setLocalNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
    } catch {
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const unreadNotifs = localNotifs.filter((n) => !n.isRead);

  return (
    <>
      {isProfileIncomplete && !bannerDismissed && (
        <div className={styles.banner}>
          <button
            className={styles.bannerClose}
            onClick={() => setBannerDismissed(true)}
            type="button"
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
          <div className={styles.bannerText}>
            <span className={styles.bannerTitle}>Complete your profile</span>
            <span className={styles.bannerDesc}>
              Add your name, LGA, and address to get personalised schedules and notifications.
            </span>
          </div>
          <Link href="/onboarding" className={styles.bannerLink}>Complete now</Link>
        </div>
      )}

      {unreadNotifs.length > 0 && (
        <div className={styles.notifSection}>
          <div className={styles.notifSectionHeader}>
            <Bell size={16} strokeWidth={1.5} />
            <span className={styles.notifSectionTitle}>Unread Notifications</span>
            <Link href="/notifications" className={styles.notifSectionLink}>View all</Link>
          </div>
          {unreadNotifs.map((n) => (
            <div key={n.id} className={styles.notifRow}>
              <Link href="/notifications" className={styles.notifRowContent}>
                <div className={styles.notifRowTop}>
                  <span className={styles.notifRowType}>{n.typeLabel}</span>
                </div>
                <span className={styles.notifRowTitle}>{n.title}</span>
              </Link>
              <button
                className={styles.markReadBtn}
                onClick={() => handleMarkRead(n.id)}
                type="button"
                disabled={markingIds.has(n.id)}
                aria-label="Mark as read"
              >
                <CircleCheck size={16} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

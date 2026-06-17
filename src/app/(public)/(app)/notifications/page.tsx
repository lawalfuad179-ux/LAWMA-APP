import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { NOTIFICATION_TYPE_LABELS } from '@/constants';
import styles from './page.module.css';

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const notifications = await db.notification.findMany({
    where: { residentId: session.residentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Notifications</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} unread</span>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>
            <div className={styles.emptyBlob1} />
            <div className={styles.emptyBlob2} />
            <div className={styles.emptyCard}>
              <Bell size={32} strokeWidth={1.2} className={styles.emptyCardIcon} />
            </div>
          </div>
          <h2 className={styles.emptyTitle}>No notifications yet</h2>
          <p className={styles.emptySubtext}>
            You don&apos;t have any notifications right now. They will appear here when something needs your attention.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <div key={n.id} className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}>
              <div className={styles.itemTop}>
                <div className={styles.itemTopLeft}>
                  <span className={styles.type}>{NOTIFICATION_TYPE_LABELS[n.type] || n.type}</span>
                  {!n.isRead && <span className={styles.dot} />}
                </div>
                <span className={styles.time}>
                  {new Date(n.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className={styles.itemTitle}>{n.title}</p>
              <p className={styles.itemBody}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

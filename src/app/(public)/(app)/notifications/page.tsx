import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
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
        <h1 className={styles.title}>Notifications</h1>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount} unread</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className={styles.empty}>No notifications yet.</p>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <Card key={n.id} className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}>
              <div className={styles.itemTop}>
                <span className={styles.type}>{NOTIFICATION_TYPE_LABELS[n.type] || n.type}</span>
                {!n.isRead && <span className={styles.dot} />}
              </div>
              <p className={styles.itemTitle}>{n.title}</p>
              <p className={styles.itemBody}>{n.body}</p>
              <span className={styles.time}>
                {new Date(n.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

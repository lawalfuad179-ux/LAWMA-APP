import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationList } from '@/components/notifications/NotificationList';
import { BackButton } from '@/components/ui/BackButton';
import styles from './page.module.css';

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const notifications = await db.notification.findMany({
    where: { residentId: session.residentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BackButton className={styles.back} />
        </div>
      </div>
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './RecyclingPageHeader.module.css';

export function RecyclingPageHeader() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Recycling</h1>
      <div className={styles.actions}>
        <ThemeToggle />
        <Link href="/notifications" className={styles.bell} aria-label="Notifications">
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './AppHeader.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schedules': 'Collection Schedule',
  '/complaints': 'My Reports',
  '/payments': 'Payments',
  '/recycling': 'Recycling',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
};

export function AppHeader() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, []);

  const title = PAGE_TITLES[pathname] || 'LAWMA';

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.actions}>
        <Link href="/notifications" className={styles.bellButton} aria-label="Notifications">
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

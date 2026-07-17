'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import FilledBellIcon from '@/components/icons/filled-bell-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';
import styles from './AppHeader.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schedules': 'Schedule',
  '/complaints': 'Reports',
  '/payments': 'Payments',
  '/recycling': 'Recycling',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
};

export function AppHeader() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<AnimatedIconHandle>(null);
  const prevUnreadCount = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, []);

  // Live-refresh the unread badge when notifications are marked read —
  // mirrors Navbar.tsx, which already listens for this. Without this,
  // AppHeader's badge only reflects whatever it fetched on mount and stays
  // stale until the next full navigation remounts the component.
  useEffect(() => {
    function onUnreadChanged(e: Event) {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      if (typeof detail?.count === 'number') setUnreadCount(detail.count);
    }
    window.addEventListener('notifications:unread-changed', onUnreadChanged);
    return () => window.removeEventListener('notifications:unread-changed', onUnreadChanged);
  }, []);

  // Ring the bell only when the count goes up (a new notification actually
  // arrived) — never on first mount, and never when it drops from being read.
  useEffect(() => {
    if (prevUnreadCount.current !== null && unreadCount > prevUnreadCount.current) {
      bellRef.current?.startAnimation();
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const title = PAGE_TITLES[pathname] || 'LAWMA';

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.actions}>
        <Link
          href="/notifications"
          className={styles.bellButton}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <FilledBellIcon ref={bellRef} size={20} />
          {unreadCount > 0 && (
            <span className={styles.badge} aria-live="polite">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

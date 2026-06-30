'use client';

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Truck, AlertCircle, CreditCard, Megaphone, Leaf, CheckCheck, Check } from 'lucide-react';

import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { NOTIFICATION_TYPE_LABELS } from '@/constants';
import emptyBoxData from '../../../public/animations/empty-box.json';
import styles from './NotificationList.module.css';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
};

type Props = {
  initialNotifications: Notification[];
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COLLECTION_REMINDER: <Truck size={16} strokeWidth={1.8} />,
  DELAYED_PICKUP:      <AlertCircle size={16} strokeWidth={1.8} />,
  COMPLAINT_UPDATE:    <AlertCircle size={16} strokeWidth={1.8} />,
  PAYMENT_CONFIRMATION:<CreditCard size={16} strokeWidth={1.8} />,
  ANNOUNCEMENT:        <Megaphone size={16} strokeWidth={1.8} />,
  RECYCLING_REWARD:    <Leaf size={16} strokeWidth={1.8} />,
};

const TYPE_COLOR: Record<string, string> = {
  COLLECTION_REMINDER:  'info',
  DELAYED_PICKUP:       'warning',
  COMPLAINT_UPDATE:     'warning',
  PAYMENT_CONFIRMATION: 'success',
  ANNOUNCEMENT:         'neutral',
  RECYCLING_REWARD:     'success',
};

export function NotificationList({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const reduced = useReducedMotion();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function emitUnreadCount(count: number) {
    window.dispatchEvent(new CustomEvent('notifications:unread-changed', { detail: { count } }));
  }

  function markOne(id: string) {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      emitUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });
    startTransition(async () => {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    });
  }

  function markAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    emitUnreadCount(0);
    startTransition(async () => {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    });
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.emptyState}>
        <LottiePlayer
          animationData={emptyBoxData}
          loop
          autoplay
          style={{ width: 120, height: 120 }}
        />
        <h2 className={styles.emptyTitle}>No notifications yet</h2>
        <p className={styles.emptySubtext}>
          You don&apos;t have any notifications right now. They will appear here when something needs your attention.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        {unreadCount > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={markAll}
            disabled={isPending}
            type="button"
          >
            <CheckCheck size={14} strokeWidth={2} />
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`${styles.iconWrap} ${styles[`icon_${TYPE_COLOR[n.type] ?? 'neutral'}`]}`}>
              {TYPE_ICONS[n.type] ?? <Bell size={16} strokeWidth={1.8} />}
            </div>

            <div className={styles.content}>
              <div className={styles.meta}>
                <span className={styles.type}>{NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}</span>
                <span className={styles.time}>
                  {new Date(n.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className={styles.title}>{n.title}</p>
              <p className={styles.body}>{n.body}</p>
            </div>

            {!n.isRead && (
              <button
                className={styles.readBtn}
                onClick={() => markOne(n.id)}
                disabled={isPending}
                type="button"
                aria-label="Mark as read"
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

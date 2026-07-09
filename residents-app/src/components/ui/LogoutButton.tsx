'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LogoutButton.module.css';

type Props = {
  variant?: 'danger' | 'sidebar';
};

export function LogoutButton({ variant = 'danger' }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  }, [router]);

  return (
    <>
      <button className={`${styles.trigger} ${variant === 'sidebar' ? styles.sidebarTrigger : styles.pageTrigger}`} onClick={() => setShowConfirm(true)} type="button">
        Sign Out
      </button>

      {showConfirm ? (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.title}>Sign out</h3>
            <p className={styles.text}>Are you sure you want to sign out?</p>
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={() => setShowConfirm(false)} type="button">Cancel</button>
              <button className={styles.confirm} onClick={handleLogout} type="button" disabled={loggingOut}>
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

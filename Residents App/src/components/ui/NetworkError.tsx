'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import styles from './NetworkError.module.css';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function NetworkError({
  message = 'Network error. Check your connection and try again.',
  onRetry,
}: Props) {
  return (
    <div className={styles.root} role="alert">
      <WifiOff size={18} strokeWidth={1.5} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry} type="button">
          <RefreshCw size={14} strokeWidth={1.5} />
          Try again
        </button>
      )}
    </div>
  );
}

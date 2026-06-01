'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

type ToastVariant = 'info' | 'success' | 'error';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, variant = 'info', onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const classes = [styles.root, styles[variant], visible ? styles.visible : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert">
      <span>{message}</span>
      <button className={styles.close} onClick={() => { setVisible(false); setTimeout(onClose, 300); }} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

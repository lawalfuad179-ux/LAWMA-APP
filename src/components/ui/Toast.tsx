'use client';

import { useEffect, useState } from 'react';
import { UserCheck, XCircle, AlertCircle, Info, X } from 'lucide-react';

import type { ToastVariant } from '@/context/ToastContext';
import styles from './Toast.module.css';

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: UserCheck,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

type Props = {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, variant = 'info', onClose, duration = 4000 }: Props) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[variant];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 280);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  function dismiss() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  return (
    <div
      className={[styles.root, styles[variant], visible ? styles.visible : ''].filter(Boolean).join(' ')}
      role="alert"
      aria-live="polite"
      style={{ pointerEvents: 'all' }}
    >
      <Icon size={22} strokeWidth={2} className={styles.icon} aria-hidden />
      <span className={styles.message}>{message}</span>
      <button className={styles.close} onClick={dismiss} aria-label="Dismiss notification">
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

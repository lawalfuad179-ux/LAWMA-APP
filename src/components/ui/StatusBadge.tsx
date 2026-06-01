import styles from './StatusBadge.module.css';

type StatusBadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
};

const variantClass: Record<StatusBadgeVariant, string> = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  neutral: styles.neutral,
};

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  const classes = [styles.root, variantClass[variant], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{label}</span>;
}

/** Maps complaint statuses to badge variants */
export function getComplaintBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'SUBMITTED':
      return 'info';
    case 'IN_REVIEW':
      return 'warning';
    case 'ASSIGNED':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    default:
      return 'neutral';
  }
}

/** Maps payment statuses to badge variants */
export function getPaymentBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'SUCCESSFUL':
      return 'success';
    case 'FAILED':
      return 'error';
    default:
      return 'neutral';
  }
}

/** Maps bill statuses to badge variants */
export function getBillBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'PAID':
      return 'success';
    case 'OVERDUE':
      return 'error';
    default:
      return 'neutral';
  }
}

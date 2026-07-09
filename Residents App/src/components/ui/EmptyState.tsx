import styles from './EmptyState.module.css';

type EmptyVariant = 'complaints' | 'notifications' | 'payments' | 'schedule' | 'default';

type EmptyStateProps = {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
};

const defaults: Record<EmptyVariant, { title: string; message: string }> = {
  complaints: { title: 'No reports yet', message: 'You have not submitted any reports yet.' },
  notifications: { title: 'No notifications', message: 'You do not have any notifications yet.' },
  payments: { title: 'No payments', message: 'No payment records found.' },
  schedule: { title: 'No schedule assigned', message: 'We are still assigning a collection schedule for your area.' },
  default: { title: 'Nothing here', message: '' },
};

export function EmptyState({ variant = 'default', title, message, action }: EmptyStateProps) {
  const config = defaults[variant];

  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h3 className={styles.title}>{title || config.title}</h3>
      <p className={styles.message}>{message || config.message}</p>
      {action ? (
        <button className={styles.action} onClick={action.onClick} type="button">
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

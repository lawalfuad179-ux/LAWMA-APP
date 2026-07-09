import styles from './Badge.module.css';

type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  neutral: styles.neutral,
};

export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  const classes = [styles.root, variantClass[variant], className].filter(Boolean).join(' ');
  return <span className={classes}>{label}</span>;
}

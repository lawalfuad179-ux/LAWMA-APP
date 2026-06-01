import styles from './EmptyState.module.css';

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon = '📭', title, description, children, className }: EmptyStateProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClassName}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  );
}

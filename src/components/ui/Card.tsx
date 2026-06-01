import styles from './Card.module.css';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className, onClick }: CardProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  if (onClick) {
    return (
      <button type="button" className={`${rootClassName} ${styles.clickable}`} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={rootClassName}>{children}</div>;
}

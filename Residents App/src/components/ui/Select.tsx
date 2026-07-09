import styles from './Select.module.css';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
};

export function Select({
  label,
  options,
  placeholder = 'Select an option',
  error,
  icon,
  id,
  className,
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClassName}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.selectWrapper}>
        {icon && <span className={styles.iconWrap}>{icon}</span>}
        <select
          id={selectId}
          className={`${styles.select} ${error ? styles.selectError : ''} ${icon ? styles.selectWithIcon : ''}`}
          aria-describedby={errorId}
          aria-invalid={!!error}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

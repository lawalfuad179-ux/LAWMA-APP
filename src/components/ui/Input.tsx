'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helpText?: string;
};

export function Input({
  label,
  error,
  helpText,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className={rootClassName}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          className={`${styles.input} ${error ? styles.inputError : ''} ${isPassword ? styles.inputPassword : ''}`}
          aria-describedby={errorId}
          aria-invalid={!!error}
          {...props}
          type={isPassword && showPassword ? 'text' : props.type}
        />
        {isPassword && (
          <button
            className={styles.eyeBtn}
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOff size={20} strokeWidth={1.5} />
              : <Eye    size={20} strokeWidth={1.5} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className={styles.helpText}>{helpText}</p>
      )}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import styles from './OtpInput.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, error, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  function handleBeforeInput(i: number, e: React.FormEvent<HTMLInputElement>) {
    e.preventDefault();
    const char = ((e.nativeEvent as InputEvent).data ?? '').replace(/\D/g, '');
    if (!char) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join(''));
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; onChange(next.join(''));
      } else if (i > 0) {
        const next = [...digits]; next[i - 1] = ''; onChange(next.join(''));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className={styles.root}>
      <div className={styles.boxes}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            className={`${styles.box} ${error ? styles.boxError : ''}`}
            type="text"
            inputMode="numeric"
            value={digit}
            autoFocus={autoFocus && i === 0}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            onBeforeInput={(e) => handleBeforeInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onChange={() => {}}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

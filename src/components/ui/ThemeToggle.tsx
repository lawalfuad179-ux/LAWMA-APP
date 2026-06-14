'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lawma-theme');
    if (stored === 'dark') {
      setDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('lawma-theme', next ? 'dark' : 'light');
  }

  return (
    <button
      className={`${styles.toggle}${className ? ` ${className}` : ''}`}
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark
        ? <Moon size={18} strokeWidth={1.5} className={styles.icon} />
        : <Sun  size={18} strokeWidth={1.5} className={styles.icon} />}
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // No stored choice means the OS preference decides (the inline script in
    // the root layout already applied it before paint — this syncs the switch).
    const stored = localStorage.getItem('lawma-theme');
    const isDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('lawma-theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      className={`${styles.themeSwitch}${className ? ` ${className}` : ''}`}
      data-theme-state={dark ? 'dark' : 'light'}
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={styles.themeSwitchThumb} aria-hidden="true" />
      <span className={`${styles.themeSwitchOption} ${styles.themeSwitchOptionLight}`}>
        <Sun size={17} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className={`${styles.themeSwitchOption} ${styles.themeSwitchOptionDark}`}>
        <Moon size={17} strokeWidth={2.25} aria-hidden="true" />
      </span>
    </button>
  );
}

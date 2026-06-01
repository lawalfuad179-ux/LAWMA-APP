'use client';

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
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
    <button className={styles.toggle} onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <span className={`${styles.icon} ${dark ? styles.moon : styles.sun}`}>
        {dark ? '\u263E' : '\u2600'}
      </span>
    </button>
  );
}

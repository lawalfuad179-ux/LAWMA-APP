'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Navbar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/schedules', label: 'Schedule', icon: '📅' },
  { href: '/complaints', label: 'Issues', icon: '📸' },
  { href: '/payments', label: 'Payments', icon: '💳' },
];

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.item} ${isActive(item.href) ? styles.active : ''}`}
        >
          <span className={styles.icon} aria-hidden="true">{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

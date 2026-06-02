'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Navbar.module.css';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    href: '/schedules',
    label: 'Schedule',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    href: '/complaints',
    label: 'Report',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, []);

  const activeClass = (href: string) => {
    const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
    return active ? styles.itemActive : '';
  };

  return (
    <>
      {/* ─── Desktop Top Nav ─── */}
      <nav className={styles.desktopNav}>
        <div className={styles.desktopInner}>
          <Link href="/dashboard" className={styles.brand}>
            <img src="/logo-light.png" alt="LAWMA" className={styles.brandLogoLight} />
            <img src="/logo-dark.png" alt="LAWMA" className={styles.brandLogoDark} />
          </Link>
          <div className={styles.desktopLinks}>
            {navItems.map(({ href, label }) => (
              <Link key={href} href={href} className={`${styles.desktopLink} ${activeClass(href)}`}>
                {label}
              </Link>
            ))}
            {unreadCount > 0 ? (
              <span className={styles.desktopBadge}>{unreadCount}</span>
            ) : null}
          </div>
        </div>
      </nav>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className={styles.mobileNav}>
        {navItems.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={`${styles.mobileItem} ${activeClass(href)}`}>
            <span className={styles.mobileIcon}>
              {icon}
              {href === '/profile' && unreadCount > 0 ? (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
            </span>
            <span className={styles.mobileLabel}>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

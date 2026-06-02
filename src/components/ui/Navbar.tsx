'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Navbar.module.css';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    href: '/schedules',
    label: 'Schedule',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    href: '/complaints',
    label: 'Report',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

const SIDEBAR_W_EXPANDED = '220px';
const SIDEBAR_W_COLLAPSED = '64px';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('lawma-sidebar');
    const isCollapsed = stored === 'true';
    setCollapsed(isCollapsed);
    document.documentElement.style.setProperty('--sidebar-w', isCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
  }, []);

  const toggleSidebar = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('lawma-sidebar', next ? 'true' : 'false');
    document.documentElement.style.setProperty('--sidebar-w', next ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
  }, [collapsed]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  }, [router]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.sidebarBrand}>
            <img src="/logo-light.png" alt="LAWMA" className={styles.sidebarLogoLight} />
            <img src="/logo-dark.png" alt="LAWMA" className={styles.sidebarLogoDark} />
            <img src="/favicon.png" alt="" className={styles.sidebarFavicon} />
          </Link>
          <button className={styles.collapseBtn} onClick={toggleSidebar} type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={collapsed ? styles.chevronRight : styles.chevronLeft}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.sidebarLink} ${isActive(href) ? styles.sidebarLinkActive : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className={styles.sidebarLinkIcon}>
                {icon}
                {href === '/profile' && unreadCount > 0 ? (
                  <span className={styles.sidebarBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                ) : null}
              </span>
              <span className={styles.sidebarLinkLabel}>{label}</span>
            </Link>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={() => setShowConfirm(true)} type="button" title={collapsed ? 'Sign out' : undefined}>
          <span className={styles.logoutIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className={styles.logoutLabel}>Sign out</span>
        </button>
      </aside>

      {/* ─── Logout Confirmation ─── */}
      {showConfirm ? (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Sign out</h3>
            <p className={styles.confirmText}>Are you sure you want to sign out?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)} type="button">Cancel</button>
              <button className={styles.confirmLogout} onClick={handleLogout} type="button" disabled={loggingOut}>
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className={styles.mobileNav}>
        {navItems.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={`${styles.mobileItem} ${isActive(href) ? styles.mobileItemActive : ''}`}>
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

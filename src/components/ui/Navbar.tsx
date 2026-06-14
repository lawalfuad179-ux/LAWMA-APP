'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  CalendarDays,
  AlertCircle,
  CreditCard,
  Leaf,
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import styles from './Navbar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Home',      Icon: Home },
  { href: '/schedules', label: 'Schedule',  Icon: CalendarDays },
  { href: '/complaints',label: 'Report',    Icon: AlertCircle },
  { href: '/payments',  label: 'Payments',  Icon: CreditCard },
  { href: '/recycling', label: 'Recycling', Icon: Leaf },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

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

  useEffect(() => {
    const storedTheme = localStorage.getItem('lawma-theme');
    setDark(storedTheme === 'dark');
  }, []);

  // Close hamburger sheet when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('lawma-sidebar', next ? 'true' : 'false');
    document.documentElement.style.setProperty('--sidebar-w', next ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
  }, [collapsed]);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('lawma-theme', next ? 'dark' : 'light');
  }, [dark]);

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
            <img src="/logo-dark.png"  alt="LAWMA" className={styles.sidebarLogoDark} />
            <img src="/favicon.png"    alt=""       className={styles.sidebarFavicon} />
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={toggleSidebar}
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight size={16} strokeWidth={1.5} />
              : <ChevronLeft  size={16} strokeWidth={1.5} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.sidebarLink} ${isActive(href) ? styles.sidebarLinkActive : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className={styles.sidebarLinkIcon}>
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <span className={styles.sidebarLinkLabel}>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom account section */}
        <div className={styles.sidebarAccount}>
          <Link
            href="/profile"
            className={`${styles.sidebarAccountLink} ${isActive('/profile') ? styles.sidebarLinkActive : ''}`}
            title={collapsed ? 'Profile' : undefined}
          >
            <span className={styles.sidebarLinkIcon}><User size={20} strokeWidth={1.5} /></span>
            <span className={styles.sidebarLinkLabel}>Profile</span>
          </Link>
          <Link
            href="/notifications"
            className={`${styles.sidebarAccountLink} ${isActive('/notifications') ? styles.sidebarLinkActive : ''}`}
            title={collapsed ? 'Notifications' : undefined}
          >
            <span className={styles.sidebarLinkIcon}>
              <Bell size={20} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className={styles.sidebarBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </span>
            <span className={styles.sidebarLinkLabel}>Notifications</span>
          </Link>
          <button
            className={styles.sidebarThemeBtn}
            onClick={toggleTheme}
            type="button"
            title={collapsed ? (dark ? 'Light mode' : 'Dark mode') : undefined}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className={styles.sidebarLinkIcon}>
              {dark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
            </span>
            <span className={styles.sidebarLinkLabel}>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={() => setShowConfirm(true)}
          type="button"
          title={collapsed ? 'Sign out' : undefined}
        >
          <span className={styles.logoutIcon}><LogOut size={20} strokeWidth={1.5} /></span>
          <span className={styles.logoutLabel}>Sign out</span>
        </button>
      </aside>

      {/* ─── Logout Confirmation Modal ─── */}
      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Sign out</h3>
            <p className={styles.confirmText}>Are you sure you want to sign out?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)} type="button">Cancel</button>
              <button className={styles.confirmLogout} onClick={handleLogout} type="button" disabled={loggingOut}>
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Hamburger (top-left) ─── */}
      <button
        className={styles.hamburgerBtn}
        onClick={() => setMenuOpen(true)}
        type="button"
        aria-label="Open menu"
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className={styles.mobileNav}>
        {navItems.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`${styles.mobileItem} ${isActive(href) ? styles.mobileItemActive : ''}`}>
            <span className={styles.mobileIcon}>
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <span className={styles.mobileLabel}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* ─── Mobile Menu Sheet ─── */}
      {menuOpen && (
        <div className={styles.sheetOverlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>My Account</span>
              <button className={styles.sheetClose} onClick={() => setMenuOpen(false)} type="button" aria-label="Close menu">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className={styles.sheetBody}>
              <Link href="/profile" className={styles.sheetItem}>
                <span className={styles.sheetItemIcon}><User size={20} strokeWidth={1.5} /></span>
                <span className={styles.sheetItemLabel}>Profile</span>
              </Link>
              <Link href="/notifications" className={styles.sheetItem}>
                <span className={styles.sheetItemIcon}>
                  <Bell size={20} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </span>
                <span className={styles.sheetItemLabel}>Notifications</span>
                {unreadCount > 0 && (
                  <span className={styles.sheetBadgeLabel}>{unreadCount} unread</span>
                )}
              </Link>
              <button className={styles.sheetItem} onClick={toggleTheme} type="button">
                <span className={styles.sheetItemIcon}>
                  {dark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
                </span>
                <span className={styles.sheetItemLabel}>{dark ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>

            <div className={styles.sheetDivider} />

            <button className={styles.sheetLogout} onClick={() => { setMenuOpen(false); setShowConfirm(true); }} type="button">
              <LogOut size={18} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

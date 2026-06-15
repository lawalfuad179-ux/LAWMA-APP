'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setProfileName(d.name || ''); setProfileAvatar(d.avatarUrl || null); } })
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

  useEffect(() => {
    if (!showConfirm) return;
    const el = confirmModalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
    focusable[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowConfirm(false); return; }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showConfirm]);

  useEffect(() => {
    if (!menuOpen) return;
    const el = sheetRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
    focusable[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setMenuOpen(false); return; }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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
            <Image src="/logo-light.png" alt="LAWMA" width={150} height={28} className={styles.sidebarLogoLight} />
            <Image src="/logo-dark.png"  alt="LAWMA" width={150} height={28} className={styles.sidebarLogoDark} />
            <Image src="/favicon.png"    alt=""       width={28}  height={28} className={styles.sidebarFavicon} aria-hidden="true" />
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

          <div style={{ flex: '0 0 0', height: 0 }} />

          <Link
            href="/profile"
            className={`${styles.sidebarLink} ${isActive('/profile') ? styles.sidebarLinkActive : ''}`}
            title={collapsed ? 'Profile' : undefined}
          >
            <span className={styles.sidebarLinkIcon}>
              {profileAvatar ? (
                <img src={profileAvatar} alt="" className={styles.sidebarAvatar} />
              ) : (
                <span className={styles.sidebarAvatarInitial}>
                  {profileName ? profileName.charAt(0).toUpperCase() : <User size={18} strokeWidth={1.5} />}
                </span>
              )}
            </span>
            <span className={styles.sidebarLinkLabel}>Profile</span>
          </Link>
          <Link
            href="/notifications"
            className={`${styles.sidebarLink} ${isActive('/notifications') ? styles.sidebarLinkActive : ''}`}
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
            className={styles.logoutBtn}
            onClick={() => setShowConfirm(true)}
            type="button"
            title={collapsed ? 'Sign out' : undefined}
          >
            <span className={styles.logoutIcon}><LogOut size={20} strokeWidth={1.5} /></span>
            <span className={styles.logoutLabel}>Sign out</span>
          </button>
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
        </nav>
      </aside>

      {/* ─── Logout Confirmation Modal ─── */}
      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div
            ref={confirmModalRef}
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
          >
            <h3 id="logout-dialog-title" className={styles.confirmTitle}>Sign out</h3>
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
          <div
            ref={sheetRef}
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="My Account"
          >
            <div className={styles.sheetHeader}>
              <Link href="/profile" className={styles.sheetProfileRow}>
                {profileAvatar ? (
                  <img src={profileAvatar} alt="" className={styles.sheetAvatar} />
                ) : (
                  <span className={styles.sheetAvatarInitial}>
                    {profileName ? profileName.charAt(0).toUpperCase() : <User size={20} strokeWidth={1.5} />}
                  </span>
                )}
                <div className={styles.sheetProfileInfo}>
                  <span className={styles.sheetTitle}>{profileName || 'My Account'}</span>
                  <span className={styles.sheetProfileSub}>View profile</span>
                </div>
              </Link>
              <button className={styles.sheetClose} onClick={() => setMenuOpen(false)} type="button" aria-label="Close menu">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className={styles.sheetBody}>
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
            </div>

            <div className={styles.sheetDivider} />

            <button className={styles.sheetLogout} onClick={() => { setMenuOpen(false); setShowConfirm(true); }} type="button">
              <LogOut size={18} strokeWidth={1.5} />
              Sign out
            </button>

            <div className={styles.sheetDivider} />

            <button className={styles.sheetItem} onClick={toggleTheme} type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span className={styles.sheetItemIcon}>
                {dark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
              </span>
              <span className={styles.sheetItemLabel}>{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

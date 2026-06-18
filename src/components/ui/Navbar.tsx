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
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ChevronUp,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AiRecycleIcon } from '@/components/ui/icons/AiRecycleIcon';
import styles from './Navbar.module.css';

// Desktop sidebar nav items (all 5)
const sidebarItems = [
  { href: '/dashboard', label: 'Home',      Icon: Home },
  { href: '/schedules', label: 'Schedule',  Icon: CalendarDays },
  { href: '/recycling', label: 'Recycling', Icon: ({ size }: { size?: number }) => <AiRecycleIcon size={size || 22} color="currentColor" /> },
  { href: '/payments',  label: 'Payments',  Icon: CreditCard },
  { href: '/complaints',label: 'Report',    Icon: AlertCircle },
];

// Mobile bottom nav: 4 items + center AI Recycle button
const mobileNavLeft  = [
  { href: '/dashboard', label: 'Home',     Icon: Home },
  { href: '/schedules', label: 'Schedule', Icon: CalendarDays },
];
const mobileNavRight = [
  { href: '/complaints', label: 'Report',   Icon: AlertCircle },
  { href: '/payments',   label: 'Payments', Icon: CreditCard },
];

const SIDEBAR_W_EXPANDED = '280px';
const SIDEBAR_W_COLLAPSED = '72px';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileLocation, setProfileLocation] = useState('');
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const logoutPopupRef = useRef<HTMLDivElement>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setProfileName(d.name || ''); setProfileAvatar(d.avatarUrl || null); const loc = d.address || (d.lga ? `${d.lga} · Lagos` : ''); setProfileLocation(loc || 'Not set yet'); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('lawma-sidebar');
    const isCollapsed = stored === 'true';
    setCollapsed(isCollapsed);
    document.documentElement.style.setProperty('--sidebar-w', isCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
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

  useEffect(() => {
    if (!showLogoutPopup) return;
    function onDown(e: MouseEvent) {
      if (logoutPopupRef.current && !logoutPopupRef.current.contains(e.target as Node)) {
        setShowLogoutPopup(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showLogoutPopup]);

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
        <button
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} strokeWidth={1.5} />
            : <ChevronLeft  size={16} strokeWidth={1.5} />}
        </button>

        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.sidebarBrand}>
            <Image src="/logo-light.png" alt="LAWMA" width={150} height={28} className={styles.sidebarLogoLight} style={{ width: 'auto', height: 'auto' }} />
            <Image src="/logo-dark.png"  alt="LAWMA" width={150} height={28} className={styles.sidebarLogoDark} style={{ width: 'auto', height: 'auto' }} />
            <Image src="/favicon.png"    alt=""       width={28}  height={28} className={styles.sidebarFavicon} aria-hidden="true" />
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map(({ href, label, Icon }) => (
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

        {/* Sidebar bottom profile */}
        <div className={styles.sidebarProfileWrapper}>
          <button
            className={styles.sidebarProfile}
            onClick={() => setShowLogoutPopup((v) => !v)}
            type="button"
          >
          <div className={styles.sidebarProfileAvatar}>
            {profileAvatar ? (
              <img src={profileAvatar} alt="" />
            ) : (
              <span>{profileName ? profileName.charAt(0).toUpperCase() : <User size={18} strokeWidth={1.5} />}</span>
            )}
          </div>
          <div className={styles.sidebarProfileText}>
            <div className={styles.sidebarProfileName}>{profileName || 'Resident'}</div>
            <div className={styles.sidebarProfileLocation}>{profileLocation}</div>
          </div>
          <ChevronUp size={14} strokeWidth={1.5} className={styles.profileChevron} />
          </button>

          {showLogoutPopup && (
            <div ref={logoutPopupRef} className={styles.logoutPopup}>
              <Link href="/profile" className={styles.logoutPopupItem}>
                <User size={16} strokeWidth={1.5} />
                Account
              </Link>
              <button
                className={`${styles.logoutPopupItem} ${styles.logoutPopupDanger}`}
                onClick={() => { setShowLogoutPopup(false); setShowConfirm(true); }}
                type="button"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          )}
        </div>
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

      {/* ─── Mobile Topbar (fixed, full-width) ─── */}
      <header className={styles.mobileTopbar}>
        <button
          className={styles.mobileHamburger}
          onClick={() => setMenuOpen(true)}
          type="button"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <Link href="/dashboard" className={styles.mobileTopbarLogo}>
          <Image src="/logo-light.png" alt="LAWMA" width={90} height={22} className={styles.mobileLogoLight} style={{ width: 'auto', height: 'auto' }} />
          <Image src="/logo-dark.png"  alt="LAWMA" width={90} height={22} className={styles.mobileLogoDark} style={{ width: 'auto', height: 'auto' }} />
        </Link>
        <Link href="/notifications" aria-label="Notifications" className={styles.mobileTopbarBell}>
          <Bell size={22} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className={styles.mobileTopbarBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className={styles.mobileNav}>
        {mobileNavLeft.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`${styles.mobileItem} ${isActive(href) ? styles.mobileItemActive : ''}`}>
            <span className={styles.mobileIcon}><Icon size={22} strokeWidth={1.5} /></span>
            <span className={styles.mobileLabel}>{label}</span>
          </Link>
        ))}

        {/* Center AI Recycle button */}
        <div className={`${styles.mobileCenterSlot} ${isActive('/recycling') ? styles.mobileCenterSlotActive : ''}`}>
          <Link
            href="/recycling"
            className={`${styles.mobileCenterBtn} ${isActive('/recycling') ? styles.mobileCenterBtnActive : ''}`}
            aria-label="Scan & Recycle"
          >
            <AiRecycleIcon size={26} />
          </Link>
        </div>

        {mobileNavRight.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`${styles.mobileItem} ${isActive(href) ? styles.mobileItemActive : ''}`}>
            <span className={styles.mobileIcon}><Icon size={22} strokeWidth={1.5} /></span>
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
                  <span className={styles.sheetProfileSub}>{profileLocation || 'Lagos'}</span>
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

            <div className={styles.sheetItem}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

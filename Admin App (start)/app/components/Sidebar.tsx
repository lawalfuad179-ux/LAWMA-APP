'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
);
const IconTruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v10H3z"/><path d="M14 10h4l3 4v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);
const IconComplaints = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
);
const IconResidents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconBins = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
);
const IconBills = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const IconAnalytics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>
);
const IconRecycle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4a1 1 0 0 1-.86-1.51l3-5a1 1 0 0 1 1.72 0L9 15"/><path d="M11 19h8a1 1 0 0 0 .86-1.51l-2.5-4"/><path d="M14 7l-2-4-2 4"/><path d="M7.5 12l-2 3.5"/><path d="M17 9l2 3.5"/></svg>
);
const IconStaff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="11" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <IconDashboard/> },
  { label: 'Pickup Schedules', href: '/pickup-schedules', icon: <IconTruck/> },
  { label: 'Complaints', href: '#complaints', icon: <IconComplaints/>, badge: '11' },
  { label: 'Residents', href: '#residents', icon: <IconResidents/> },
  { label: 'Smart Bins', href: '#smart-bins', icon: <IconBins/> },
  { label: 'Bills & Payments', href: '#bills', icon: <IconBills/> },
  { label: 'Notifications', href: '#notifications', icon: <IconBell/> },
  { label: 'Analytics', href: '#analytics', icon: <IconAnalytics/> },
  { label: 'Recycling AI Review', href: '#recycle', icon: <IconRecycle/> },
  { label: 'Staff & Roles', href: '#staff', icon: <IconStaff/> },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Image src="/logo.png" alt="LAWMA" width={130} height={45} priority style={{ height: 'auto', width: 130 }} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Operations</span>
          {navItems.slice(0, 6).map((item) => {
            const active = item.href === pathname;
            return (
              <Link key={item.label} href={item.href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Insights</span>
          {navItems.slice(6).map((item) => {
            const active = item.href === pathname;
            return (
              <Link key={item.label} href={item.href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <Link href="#settings" className={styles.settingsRow}>
        <span className={styles.navIcon}><IconSettings/></span>
        <span className={styles.navLabel}>Settings</span>
      </Link>
    </aside>
  );
}

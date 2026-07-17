'use client';

import { LogOut } from 'lucide-react';

import styles from './KioskNav.module.css';

export type KioskNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

type Props = {
  brandIcon: React.ReactNode;
  items: KioskNavItem[];
  operatorName: string;
  onSignOut: () => void;
};

/**
 * The consoles' navigation surface — a fixed icon rail on wide screens, the
 * same items as a bottom bar on portrait. Standard POS pattern (Square/Toast):
 * every destination one tap away, active state readable at arm's length,
 * identity pinned where staff expect to find themselves. No hover-expand and
 * no hamburger — counter tablets are touch devices with a queue in front.
 */
export function KioskNav({ brandIcon, items, operatorName, onSignOut }: Props) {
  const initial = (operatorName.trim().charAt(0) || 'S').toUpperCase();

  return (
    <nav className={styles.nav} aria-label="Console navigation">
      <span className={styles.brand} aria-hidden="true">
        {brandIcon}
      </span>

      <div className={styles.items} role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.active}
            className={`${styles.item} ${item.active ? styles.itemActive : ''}`}
            onClick={item.onClick}
          >
            <span className={styles.itemIcon}>{item.icon}</span>
            <span className={styles.itemLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.foot}>
        <span className={styles.operator} title={operatorName} aria-hidden="true">
          {initial}
        </span>
        <button type="button" className={styles.item} onClick={onSignOut}>
          <span className={styles.itemIcon}>
            <LogOut size={19} strokeWidth={1.8} />
          </span>
          <span className={styles.itemLabel}>Sign out</span>
        </button>
      </div>
    </nav>
  );
}

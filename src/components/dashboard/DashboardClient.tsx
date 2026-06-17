'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import styles from './DashboardClient.module.css';

type Props = {
  isProfileIncomplete: boolean;
};

export function DashboardClient({ isProfileIncomplete }: Props) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <>
      {isProfileIncomplete && !bannerDismissed && (
        <div className={styles.banner}>
          <button
            className={styles.bannerClose}
            onClick={() => setBannerDismissed(true)}
            type="button"
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
          <div className={styles.bannerText}>
            <span className={styles.bannerTitle}>Complete your profile</span>
            <span className={styles.bannerDesc}>
              Add your name, LGA, and address to get personalised schedules and notifications.
            </span>
          </div>
          <Link href="/onboarding" className={styles.bannerLink}>Complete now</Link>
        </div>
      )}
    </>
  );
}

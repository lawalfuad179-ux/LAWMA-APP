'use client';

import { LottiePlayer } from '@/components/ui/LottiePlayer';
import emptyBoxData from '../../../../../public/animations/empty-box.json';
import styles from './page.module.css';

export function EmptyBillsState() {
  return (
    <div className={styles.emptyState}>
      <LottiePlayer
        animationData={emptyBoxData}
        loop
        autoplay
        style={{ width: 120, height: 120 }}
      />
      <h2 className={styles.emptyTitle}>No bills yet</h2>
      <p className={styles.emptySubtext}>
        You don&apos;t have any bills right now. When a bill is generated, it will appear here.
      </p>
    </div>
  );
}

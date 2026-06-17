'use client';

import { useState } from 'react';
import { BookOpen, Camera, Clock } from 'lucide-react';

import { RecycleScanTab } from './RecycleScanTab';
import { RecycleHistory } from './RecycleHistory';
import styles from './RecycleTabs.module.css';

type Tab = 'guide' | 'scan' | 'history';

type RecycleTabsProps = {
  guideContent: React.ReactNode;
};

export function RecycleTabs({ guideContent }: RecycleTabsProps) {
  const [tab, setTab] = useState<Tab>('guide');

  return (
    <div className={styles.root}>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${tab === 'guide' ? styles.active : ''}`}
          onClick={() => setTab('guide')}
          type="button"
        >
          <BookOpen size={15} strokeWidth={1.8} />
          Guide
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'scan' ? styles.active : ''}`}
          onClick={() => setTab('scan')}
          type="button"
        >
          <Camera size={15} strokeWidth={1.8} />
          Scan & Earn
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'history' ? styles.active : ''}`}
          onClick={() => setTab('history')}
          type="button"
        >
          <Clock size={15} strokeWidth={1.8} />
          My History
        </button>
      </div>

      <div className={styles.panel}>
        {tab === 'guide' && guideContent}
        {tab === 'scan' && <RecycleScanTab />}
        {tab === 'history' && <RecycleHistory />}
      </div>
    </div>
  );
}

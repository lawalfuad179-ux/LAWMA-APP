'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookOpen, Camera, Clock } from 'lucide-react';

import { RecycleScanTab } from './RecycleScanTab';
import { RecycleHistory } from './RecycleHistory';
import styles from './RecycleTabs.module.css';

type Tab = 'guide' | 'scan' | 'history';

type RecycleTabsProps = {
  guideContent: React.ReactNode;
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'guide', label: 'Guide', icon: <BookOpen size={15} strokeWidth={1.8} /> },
  { id: 'scan', label: 'Scan & Analyze', icon: <Camera size={15} strokeWidth={1.8} /> },
  { id: 'history', label: 'My History', icon: <Clock size={15} strokeWidth={1.8} /> },
];

export function RecycleTabs({ guideContent }: RecycleTabsProps) {
  const [tab, setTab] = useState<Tab>('scan');
  const reduced = useReducedMotion();

  return (
    <div className={styles.root}>
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {tab === t.id && (
              <motion.span
                layoutId="recycleTabPill"
                className={styles.tabIndicator}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'guide' && guideContent}
            {tab === 'scan' && <RecycleScanTab />}
            {tab === 'history' && <RecycleHistory />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

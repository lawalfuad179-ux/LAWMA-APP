'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SwipeableComplaintCard } from './SwipeableComplaintCard';
import emptyBoxData from '../../../public/animations/empty-box.json';
import styles from './ComplaintList.module.css';

type ComplaintData = {
  id: string;
  ticketId: string;
  status: string;
  issueType: string;
  address: string;
  createdAt: Date;
};

type Props = {
  complaints: ComplaintData[];
};

export function ComplaintList({ complaints: initial }: Props) {
  const [complaints, setComplaints] = useState(initial);
  const reduced = useReducedMotion();

  const handleDelete = (id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  };

  if (complaints.length === 0) {
    return (
      <div className={styles.emptyState}>
        <LottiePlayer
          animationData={emptyBoxData}
          loop
          autoplay
          style={{ width: 120, height: 120 }}
        />
        <h2 className={styles.emptyTitle}>No reports yet</h2>
        <p className={styles.emptySubtext}>
          Spotted an issue in your neighbourhood? File a report and we&apos;ll get it sorted.
        </p>
        <Link href="/complaints/report" className={styles.emptyAction}>
          <Plus size={20} strokeWidth={2.5} />
          File a report
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {complaints.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
        >
          <SwipeableComplaintCard complaint={c} onDelete={handleDelete} />
        </motion.div>
      ))}
    </div>
  );
}

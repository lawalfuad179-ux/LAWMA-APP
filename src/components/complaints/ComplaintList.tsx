'use client';

import { useState } from 'react';
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
  onNewReport: () => void;
};

export function ComplaintList({ complaints: initial, onNewReport }: Props) {
  const [complaints, setComplaints] = useState(initial);

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
        <button onClick={onNewReport} className={styles.emptyAction}>
          <Plus size={20} strokeWidth={2.5} />
          File a report
        </button>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {complaints.map((c) => (
        <SwipeableComplaintCard key={c.id} complaint={c} onDelete={handleDelete} />
      ))}
    </div>
  );
}

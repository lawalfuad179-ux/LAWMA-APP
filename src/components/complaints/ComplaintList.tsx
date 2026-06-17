'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SwipeableComplaintCard } from './SwipeableComplaintCard';
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
        <div className={styles.emptyIllustration}>
          <div className={styles.emptyBlob1} />
          <div className={styles.emptyBlob2} />
          <div className={styles.emptyCard}>
            <svg width="60" height="68" viewBox="0 0 60 68" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="10" width="44" height="54" rx="6" fill="var(--color-surface-container)"/>
              <rect x="14" y="2" width="20" height="14" rx="4" fill="var(--color-surface-container-high)"/>
              <rect x="10" y="28" width="28" height="3" rx="1.5" fill="var(--color-outline-variant)"/>
              <rect x="10" y="37" width="20" height="3" rx="1.5" fill="var(--color-outline-variant)"/>
              <circle cx="45" cy="52" r="12" fill="var(--color-primary)"/>
              <path d="M39 52L43 56L51 46" stroke="var(--color-on-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/complaints/report" className={styles.emptyCardBadge} aria-label="File a report">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>
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

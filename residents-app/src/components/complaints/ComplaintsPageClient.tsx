'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ComplaintList } from './ComplaintList';
import styles from '../complaints/ComplaintsPageClient.module.css';

type ComplaintData = {
  id: string; ticketId: string; status: string; issueType: string; address: string; createdAt: Date;
};

type Props = {
  complaints: ComplaintData[];
};

export function ComplaintsPageClient({ complaints }: Props) {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <Link href="/complaints/report" className={styles.newReportBtn}>
          <Plus size={20} strokeWidth={2.5} />
          File a report
        </Link>
      </div>

      <ComplaintList complaints={complaints} />
    </>
  );
}

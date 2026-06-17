'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ComplaintList } from './ComplaintList';
import { ReportFormModal } from './ReportFormModal';
import styles from '../complaints/ComplaintsPageClient.module.css';

type ComplaintData = {
  id: string; ticketId: string; status: string; issueType: string; address: string; createdAt: Date;
};

type Props = {
  complaints: ComplaintData[];
};

export function ComplaintsPageClient({ complaints }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>My Reports</h1>
        <button className={styles.newReportBtn} onClick={() => setShowModal(true)} type="button">
          <Plus size={20} strokeWidth={2.5} />
          File a report
        </button>
      </div>

      <ComplaintList complaints={complaints} onNewReport={() => setShowModal(true)} />

      {showModal && (
        <ReportFormModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { ComplaintsPageClient } from '@/components/complaints/ComplaintsPageClient';
import styles from './page.module.css';

type ComplaintListItem = {
  id: string; ticketId: string; status: string; issueType: string; address: string; createdAt: Date;
};

export default async function ComplaintsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const complaints: ComplaintListItem[] = await db.complaint.findMany({
    where: { residentId: session.residentId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.page}>
      <ComplaintsPageClient complaints={complaints} />
    </div>
  );
}

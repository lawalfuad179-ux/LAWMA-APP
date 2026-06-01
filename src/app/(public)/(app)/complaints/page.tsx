import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COMPLAINT_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';

type ComplaintListItem = {
  id: string; status: string; issueType: string; address: string; createdAt: Date;
  images: { id: string }[];
};

export default async function ComplaintsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const complaints: ComplaintListItem[] = await db.complaint.findMany({
    where: { residentId: session.residentId },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Reports</h1>
        <Link href="/complaints/report">
          <Button size="sm">Report Issue</Button>
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className={styles.empty}>
          <p>No reports yet.</p>
          <Link href="/complaints/report">
            <Button variant="secondary" size="md">Report an Issue</Button>
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {complaints.map((c) => (
            <Card key={c.id} className={styles.complaintCard}>
              <div className={styles.cardHeader}>
                <Badge
                  label={COMPLAINT_STATUS_LABELS[c.status] || c.status}
                  variant={
                    c.status === 'RESOLVED' ? 'success' :
                    c.status === 'IN_REVIEW' ? 'warning' :
                    c.status === 'ASSIGNED' ? 'warning' : 'info'
                  }
                />
                <span className={styles.date}>
                  {new Date(c.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className={styles.issueType}>{c.issueType.replace(/_/g, ' ')}</p>
              <p className={styles.address}>{c.address}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

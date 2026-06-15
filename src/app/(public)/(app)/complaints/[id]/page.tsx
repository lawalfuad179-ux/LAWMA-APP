import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ImageIcon, MapPin, Tag } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_STATUS_ORDER } from '@/constants';
import styles from './page.module.css';

type Props = { params: Promise<{ id: string }> };

export default async function ComplaintDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const complaint = await db.complaint.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!complaint || complaint.residentId !== session.residentId) notFound();

  const statusIndex = COMPLAINT_STATUS_ORDER.indexOf(complaint.status);
  const steps = COMPLAINT_STATUS_ORDER.map((key, i) => ({
    key,
    label: COMPLAINT_STATUS_LABELS[key],
    date: i <= statusIndex ? new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : undefined,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/complaints" className={styles.backBtn}>
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Complaint Details</h1>
        <span className={styles.ticketId}>{complaint.ticketId}</span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Tag size={16} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Details</span>
        </div>
        <Card className={styles.sectionCard}>
          <div className={styles.row}>
            <span className={styles.label}>Issue Type</span>
            <span className={styles.value}>{complaint.issueType.replace(/_/g, ' ')}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>Status</span>
            <Badge
              label={COMPLAINT_STATUS_LABELS[complaint.status]}
              variant={
                complaint.status === 'RESOLVED' ? 'success' :
                complaint.status === 'IN_REVIEW' || complaint.status === 'ASSIGNED' ? 'warning' : 'info'
              }
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>Date Reported</span>
            <span className={styles.value}>{new Date(complaint.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>
              <MapPin size={12} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Location
            </span>
            <span className={styles.value}>{complaint.address}, {complaint.area}</span>
          </div>
          {complaint.description && (
            <>
              <div className={styles.divider} />
              <div className={styles.row}>
                <span className={styles.label}>Description</span>
                <span className={styles.value}>{complaint.description}</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {complaint.images.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <ImageIcon size={16} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Photos</span>
          </div>
          <Card className={styles.sectionCard}>
            <div className={styles.images}>
              {complaint.images.map((img) => (
                <img key={img.id} src={img.url} alt="Complaint" className={styles.image} />
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Clock size={16} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Status Timeline</span>
        </div>
        <Card className={styles.sectionCard}>
          <StatusTimeline steps={steps} currentKey={complaint.status} />
        </Card>
      </div>
    </div>
  );
}

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditComplaintForm } from '@/components/complaints/EditComplaintForm';
import styles from './page.module.css';

type Props = { params: Promise<{ id: string }> };

export default async function EditComplaintPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const complaint = await db.complaint.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!complaint || complaint.residentId !== session.residentId) notFound();

  return (
    <div className={styles.page}>
      <div>
        <Link href={`/complaints/${id}`} className={styles.backBtn}>
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Edit Report</h1>
      </div>

      <div className={styles.formCard}>
      <EditComplaintForm
        complaintId={complaint.id}
        initialIssueType={complaint.issueType}
        initialArea={complaint.area}
        initialAddress={complaint.address}
        initialDescription={complaint.description || ''}
      />
      </div>
    </div>
  );
}

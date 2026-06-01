import { redirect } from 'next/navigation';

import { getSession, destroySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({
    where: { id: session.residentId },
  });

  if (!resident) redirect('/login');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <Card className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span className={styles.value}>{resident.name || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Phone</span>
          <span className={styles.value}>{resident.phoneNumber}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>LGA</span>
          <span className={styles.value}>{resident.lga || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Address</span>
          <span className={styles.value}>{resident.address || 'Not set'}</span>
        </div>
      </Card>

      <form action={async () => {
        'use server';
        await destroySession();
        redirect('/');
      }}>
        <Button type="submit" variant="danger" size="lg">Sign Out</Button>
      </form>
    </div>
  );
}

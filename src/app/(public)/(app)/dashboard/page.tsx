import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/onboarding');
  }

  const resident = await db.resident.findUnique({
    where: { id: session.residentId },
  });

  if (!resident) {
    redirect('/onboarding');
  }

  const isOnboarded = !!(resident.name && resident.address && resident.lga);

  if (!isOnboarded) {
    redirect('/onboarding/setup');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>Welcome, {resident.name}</h1>
        <p className={styles.location}>{resident.lga}</p>
      </header>

      <div className={styles.grid}>
        <a href="/schedules" className={styles.card}>
          <h2>Collection Schedule</h2>
          <p>View your waste collection days</p>
        </a>

        <a href="/complaints" className={styles.card}>
          <h2>Report Issue</h2>
          <p>Report sanitation concerns</p>
        </a>

        <a href="/payments" className={styles.card}>
          <h2>Pay Bill</h2>
          <p>View and pay waste bills</p>
        </a>

        <a href="/recycling" className={styles.card}>
          <h2>Recycling</h2>
          <p>Learn about recycling</p>
        </a>
      </div>
    </div>
  );
}

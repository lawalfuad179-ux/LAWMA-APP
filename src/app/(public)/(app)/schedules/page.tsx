import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DAYS_OF_WEEK } from '@/constants';
import styles from './page.module.css';

type ScheduleWithOperator = {
  id: string; lga: string; dayOfWeek: number; windowStart: string; windowEnd: string;
  pspOperatorId: string; createdAt: Date;
  pspOperator: { id: string; name: string; contactPhone: string | null; email: string | null; zone: string; lga: string; createdAt: Date; };
};

export default async function SchedulesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const schedules: ScheduleWithOperator[] = await db.collectionSchedule.findMany({
    include: { pspOperator: true },
    orderBy: { dayOfWeek: 'asc' },
  });

  const today = new Date().getDay();
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === today);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Collection Schedule</h1>

      {todaySchedules.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Today</h2>
          {todaySchedules.map((s) => (
            <Card key={s.id} className={styles.scheduleCard}>
              <div className={styles.scheduleHeader}>
                <Badge label="Today" variant="success" />
                <span className={styles.time}>{s.windowStart} - {s.windowEnd}</span>
              </div>
              <p className={styles.operator}>{s.pspOperator.name}</p>
              <p className={styles.area}>{s.lga}</p>
            </Card>
          ))}
        </section>
      )}

      <section>
        <h2 className={styles.sectionTitle}>Weekly Schedule</h2>
        {schedules.map((s) => (
          <Card key={s.id} className={styles.scheduleCard}>
            <div className={styles.scheduleHeader}>
              <span className={styles.day}>{DAYS_OF_WEEK[s.dayOfWeek]}</span>
              <span className={styles.time}>{s.windowStart} - {s.windowEnd}</span>
            </div>
            <p className={styles.operator}>{s.pspOperator.name}</p>
            <p className={styles.area}>{s.lga}</p>
          </Card>
        ))}
        {schedules.length === 0 && (
          <p className={styles.empty}>No collection schedules available for your area yet.</p>
        )}
      </section>
    </div>
  );
}

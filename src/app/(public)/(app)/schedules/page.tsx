import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DAYS_OF_WEEK, COLLECTION_STATUS_LABELS } from '@/constants';
import styles from './page.module.css';

type ScheduleWithOperator = {
  id: string; lga: string; dayOfWeek: number; windowStart: string; windowEnd: string;
  status: string; delayReason: string | null; pspOperatorId: string; createdAt: Date;
  pspOperator: { id: string; name: string; contactPhone: string | null; email: string | null; zone: string; lga: string; createdAt: Date; };
};

export default async function SchedulesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({ where: { id: session.residentId } });
  if (!resident) redirect('/login');

  const schedules: ScheduleWithOperator[] = await db.collectionSchedule.findMany({
    include: { pspOperator: true },
    orderBy: { dayOfWeek: 'asc' },
  });

  const today = new Date().getDay();
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === today);
  const mySchedules = resident.lga ? schedules.filter((s) => s.lga === resident.lga) : schedules;
  const displaySchedules = mySchedules.length > 0 ? mySchedules : schedules;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Collection Schedule</h1>

      {displaySchedules.length === 0 ? (
        <p className={styles.empty}>No collection schedules available for your area yet.</p>
      ) : (
        <>
          {todaySchedules.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Today</h2>
              {todaySchedules.map((s) => (
                <Card key={s.id} className={styles.scheduleCard}>
                  <div className={styles.scheduleTop}>
                    <Badge label={COLLECTION_STATUS_LABELS[s.status] || s.status}
                      variant={s.status === 'COMPLETED' ? 'success' : s.status === 'DELAYED' ? 'warning' : s.status === 'MISSED' ? 'error' : 'info'} />
                    <span className={styles.time}>{s.windowStart} - {s.windowEnd}</span>
                  </div>
                  <span className={styles.day}>Today</span>
                  <span className={styles.operator}>{s.pspOperator.name}</span>
                  {s.status === 'DELAYED' && s.delayReason ? (
                    <div className={styles.delayBanner}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {s.delayReason}
                    </div>
                  ) : null}
                </Card>
              ))}
            </section>
          )}

          <section>
            <h2 className={styles.sectionTitle}>Weekly Schedule</h2>
            {displaySchedules.map((s) => (
              <Card key={s.id} className={styles.scheduleCard}>
                <div className={styles.scheduleTop}>
                  <Badge label={COLLECTION_STATUS_LABELS[s.status] || s.status}
                    variant={s.status === 'COMPLETED' ? 'success' : s.status === 'DELAYED' ? 'warning' : s.status === 'MISSED' ? 'error' : 'info'} />
                  <span className={styles.time}>{s.windowStart} - {s.windowEnd}</span>
                </div>
                <span className={styles.day}>{DAYS_OF_WEEK[s.dayOfWeek]}</span>
                <span className={styles.operator}>{s.pspOperator.name}</span>
                <span className={styles.area}>{s.lga}</span>
                {s.status === 'DELAYED' && s.delayReason ? (
                  <div className={styles.delayBanner}>
                    <Clock size={14} strokeWidth={1.5} />
                    {s.delayReason}
                  </div>
                ) : null}
              </Card>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

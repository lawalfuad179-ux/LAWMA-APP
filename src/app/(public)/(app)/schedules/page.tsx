import { redirect } from 'next/navigation';
import { Clock, Truck, CalendarDays, Sparkles, Leaf } from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DAYS_OF_WEEK, COLLECTION_STATUS_LABELS, type LagosLga } from '@/constants';
import { PspContactCard } from '@/components/schedules/PspContactCard';
import styles from './page.module.css';

export default async function SchedulesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const resident = await db.resident.findUnique({ where: { id: session.residentId } });
  if (!resident) redirect('/login');

  const rawSchedules = resident.lga
    ? await db.collectionSchedule.findMany({
        where: { lga: resident.lga },
        include: { pspOperator: true },
        orderBy: { dayOfWeek: 'asc' },
      })
    : [];

  // Deduplicate: one entry per dayOfWeek — keeps the first (earliest created) per day
  const seen = new Set<number>();
  const schedules = rawSchedules.filter((s) => {
    if (seen.has(s.dayOfWeek)) return false;
    seen.add(s.dayOfWeek);
    return true;
  });

  // Compute next 3 last-Saturdays for environmental days
  function getUpcomingLastSaturdays(count: number): Date[] {
    const results: Date[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let year = now.getFullYear();
    let month = now.getMonth();

    while (results.length < count) {
      const lastDay = new Date(year, month + 1, 0);
      const offset = (lastDay.getDay() - 6 + 7) % 7;
      const lastSat = new Date(year, month, lastDay.getDate() - offset);
      if (lastSat >= now) results.push(lastSat);
      month++;
      if (month > 11) { month = 0; year++; }
    }
    return results;
  }

  const environmentalDays = getUpcomingLastSaturdays(3);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const today = new Date().getDay();
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === today);

  const upcomingSchedules = schedules
    .filter((s) => s.dayOfWeek > today)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const nextPickup = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Schedule</h1>
        {resident.lga && <p className={styles.subtitle}>{resident.lga} · Lagos</p>}
      </div>

      <PspContactCard
        lga={(resident.lga as LagosLga | null) || null}
        address={resident.address}
      />

      {schedules.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>
            <div className={styles.emptyBlob1} />
            <div className={styles.emptyBlob2} />
            <div className={styles.emptyCard}>
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="14" width="60" height="50" rx="7" fill="var(--color-surface-container)"/>
                <rect x="4" y="14" width="60" height="18" rx="7" fill="var(--color-primary-container)"/>
                <rect x="4" y="24" width="60" height="8" fill="var(--color-primary-container)"/>
                <rect x="19" y="5" width="5" height="18" rx="2.5" fill="var(--color-primary)"/>
                <rect x="44" y="5" width="5" height="18" rx="2.5" fill="var(--color-primary)"/>
                <circle cx="16" cy="42" r="3.5" fill="var(--color-outline-variant)"/>
                <circle cx="28" cy="42" r="3.5" fill="var(--color-primary)" fillOpacity="0.5"/>
                <circle cx="40" cy="42" r="3.5" fill="var(--color-primary)"/>
                <circle cx="52" cy="42" r="3.5" fill="var(--color-outline-variant)"/>
                <circle cx="16" cy="55" r="3.5" fill="var(--color-outline-variant)"/>
                <circle cx="28" cy="55" r="3.5" fill="var(--color-outline-variant)"/>
                <circle cx="40" cy="55" r="3.5" fill="var(--color-outline-variant)"/>
              </svg>
            </div>
          </div>
          <h2 className={styles.emptyTitle}>No schedule yet</h2>
          <p className={styles.emptySubtext}>
            Collection schedules for your area haven&apos;t been set up yet. Check back soon.
          </p>
        </div>
      ) : (
        <>
          {todaySchedules.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <Sparkles size={15} strokeWidth={1.5} />
                  <span>Today</span>
                </div>
              </div>
              {todaySchedules.map((s) => (
                <Card key={s.id} className={styles.todayCard}>
                  <div className={styles.todayHeader}>
                    <span className={styles.todayPill}>Pickup Today</span>
                    <Badge
                      label={COLLECTION_STATUS_LABELS[s.status] || s.status}
                      variant="success"
                    />
                  </div>
                  <span className={styles.todayTime}>{s.windowStart} – {s.windowEnd}</span>
                  <div className={styles.metaRow}>
                    <Truck size={14} strokeWidth={1.5} />
                    <span>{s.pspOperator.name}</span>
                  </div>
                  {s.status === 'DELAYED' && s.delayReason ? (
                    <div className={styles.delayBanner}>
                      <Clock size={14} strokeWidth={1.5} />
                      {s.delayReason}
                    </div>
                  ) : null}
                </Card>
              ))}
            </section>
          ) : (
            <div className={styles.noToday}>
              <span className={styles.noTodayText}>No pickup scheduled for today</span>
            </div>
          )}

          {upcomingSchedules.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <CalendarDays size={15} strokeWidth={1.5} />
                  <span>Later This Week</span>
                </div>
              </div>
              <div className={styles.cardGrid}>
              {upcomingSchedules.map((s) => {
                const isNext = nextPickup?.id === s.id;
                return (
                  <Card
                    key={s.id}
                    className={`${styles.card} ${isNext ? styles.cardNext : ''}`}
                  >
                    <div className={styles.cardRow}>
                      <span className={styles.dayName}>
                        {DAYS_OF_WEEK[s.dayOfWeek]}
                        {isNext ? <span className={styles.nextTag}>Next</span> : null}
                      </span>
                      <Badge
                        label={COLLECTION_STATUS_LABELS[s.status] || s.status}
                        variant="success"
                      />
                    </div>
                    <div className={styles.metaRow}>
                      <Clock size={14} strokeWidth={1.5} />
                      <span>{s.windowStart} – {s.windowEnd}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <Truck size={14} strokeWidth={1.5} />
                      <span>{s.pspOperator.name}</span>
                    </div>
                    {s.status === 'DELAYED' && s.delayReason ? (
                      <div className={styles.delayBanner}>
                        <Clock size={14} strokeWidth={1.5} />
                        {s.delayReason}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
              </div>
            </section>
          )}
        </>
      )}
      {/* ── Environmental / Community Sanitation Days ── */}
      <section className={styles.envSection}>
        <div className={styles.envDivider}>
          <div className={styles.envDividerLine} />
          <span className={styles.envDividerLabel}>Community</span>
          <div className={styles.envDividerLine} />
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>
            <Leaf size={15} strokeWidth={1.5} />
            <span>Community Sanitation Days</span>
          </div>
        </div>

        {environmentalDays.map((date) => {
          const isToday = date.getTime() === todayDate.getTime();
          const formatted = date.toLocaleDateString('en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div key={date.toISOString()} className={styles.envCard}>
              <div className={styles.envCardHeader}>
                <span className={styles.envChip}>
                  <Leaf size={11} strokeWidth={1.5} />
                  Community
                </span>
                {isToday && <span className={styles.envTodayPill}>Today</span>}
              </div>
              <span className={styles.envDate}>{formatted}</span>
              <div className={styles.metaRow}>
                <Clock size={14} strokeWidth={1.5} />
                <span>7:00 AM – 10:00 AM</span>
              </div>
              <p className={styles.envDesc}>
                Resident-led sanitation. Clear your frontage and shared spaces. LAWMA-mandated last Saturday of every month.
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}

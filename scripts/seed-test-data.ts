/**
 * Seed test data into the database pointed at by DATABASE_URL.
 *
 * Idempotent: re-running won't duplicate bills, schedules, or operators.
 *
 * Usage (from your laptop, against prod):
 *   DATABASE_URL="<pooled prod URL>" npx tsx scripts/seed-test-data.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { LAGOS_LGAS } from '../src/constants';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Run with: DATABASE_URL="..." npx tsx scripts/seed-test-data.ts');
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const OVERDUE_BILL_AMOUNT_KOBO = 500_000; // ₦5,000

// Pickup days per LGA — chosen so every LGA gets two upcoming pickups
const SCHEDULE_DAYS = [2, 5]; // Tuesday and Friday (0 = Sunday)
const WINDOW_START = '08:00';
const WINDOW_END = '12:00';

/** Returns the next occurrence (>= today) of `dayOfWeek` (0=Sun…6=Sat) at midnight UTC. */
function nextOccurrence(dayOfWeek: number, from = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const diff = (dayOfWeek - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Returns [start, end] of the calendar month `monthsAgo` before today (UTC). */
function pastMonthPeriod(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 0));
  return { start, end };
}

async function seedBillsForResident(residentId: string) {
  let created = 0;
  for (const monthsAgo of [3, 2, 1]) {
    const { start, end } = pastMonthPeriod(monthsAgo);
    // Idempotency: skip if a bill for this resident + periodStart already exists
    const existing = await db.bill.findFirst({
      where: { residentId, periodStart: start },
      select: { id: true },
    });
    if (existing) continue;
    await db.bill.create({
      data: {
        residentId,
        amountKobo: OVERDUE_BILL_AMOUNT_KOBO,
        dueDate: end,
        periodStart: start,
        periodEnd: end,
        status: 'OVERDUE',
      },
    });
    created += 1;
  }
  return created;
}

async function ensureOperatorForLga(lga: string) {
  const existing = await db.pspOperator.findFirst({ where: { lga }, select: { id: true } });
  if (existing) return existing.id;
  const op = await db.pspOperator.create({
    data: {
      name: `${lga} PSP Operator`,
      zone: lga,
      lga,
    },
    select: { id: true },
  });
  return op.id;
}

async function seedSchedulesForLga(lga: string) {
  const operatorId = await ensureOperatorForLga(lga);
  let upserts = 0;
  for (const dayOfWeek of SCHEDULE_DAYS) {
    const nextDate = nextOccurrence(dayOfWeek);
    await db.collectionSchedule.upsert({
      where: { lga_dayOfWeek: { lga, dayOfWeek } },
      create: {
        lga,
        dayOfWeek,
        windowStart: WINDOW_START,
        windowEnd: WINDOW_END,
        status: 'SCHEDULED',
        nextCollectionDate: nextDate,
        pspOperatorId: operatorId,
      },
      update: {
        // Keep date fresh on re-run
        nextCollectionDate: nextDate,
        status: 'SCHEDULED',
        windowStart: WINDOW_START,
        windowEnd: WINDOW_END,
        pspOperatorId: operatorId,
      },
    });
    upserts += 1;
  }
  return upserts;
}

async function main() {
  console.log('Seeding test data...\n');

  const residents = await db.resident.findMany({ select: { id: true, lga: true, name: true } });
  console.log(`Found ${residents.length} residents`);

  // 1. Overdue bills per resident
  let totalBills = 0;
  for (const r of residents) {
    const n = await seedBillsForResident(r.id);
    totalBills += n;
  }
  console.log(`Created ${totalBills} new OVERDUE bills (existing bills left untouched)`);

  // 2. Pickup schedules for every Lagos LGA in the app's fixed list,
  //    so any onboarded user — regardless of which LGA they pick — sees data.
  console.log(`Seeding schedules for ${LAGOS_LGAS.length} Lagos LGAs`);
  let totalSchedules = 0;
  for (const lga of LAGOS_LGAS) {
    totalSchedules += await seedSchedulesForLga(lga);
  }
  console.log(`Upserted ${totalSchedules} collection schedules across ${LAGOS_LGAS.length} LGAs`);

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

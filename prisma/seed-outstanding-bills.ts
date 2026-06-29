/**
 * Ensures every resident has exactly 3 outstanding bills for demo purposes.
 * Safe to re-run — clears existing PENDING/OVERDUE bills first, then recreates.
 * Target DB via DATABASE_URL env var.
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const residents = await prisma.resident.findMany({ select: { id: true, name: true, phoneNumber: true, email: true } });
  console.log(`Found ${residents.length} resident(s). Resetting outstanding bills…`);

  // Delete payments then bills (FK constraint order)
  const unpaidBills = await prisma.bill.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE'] } },
    select: { id: true },
  });
  const billIds = unpaidBills.map((b) => b.id);
  await prisma.payment.deleteMany({ where: { billId: { in: billIds } } });
  const deleted = await prisma.bill.deleteMany({ where: { id: { in: billIds } } });
  console.log(`  Cleared ${deleted.count} existing pending/overdue bills.`);

  const now = new Date();

  // Bill 1 — April (2 months overdue)
  const apr = { start: new Date(2026, 3, 1), end: new Date(2026, 3, 30), due: new Date(2026, 3, 14) };
  // Bill 2 — May (1 month overdue)
  const may = { start: new Date(2026, 4, 1), end: new Date(2026, 4, 31), due: new Date(2026, 4, 14) };
  // Bill 3 — June (current, due soon)
  const jun = { start: new Date(2026, 5, 1), end: new Date(2026, 5, 30), due: new Date(2026, 6, 7) };

  for (const resident of residents) {
    await prisma.bill.createMany({
      data: [
        { residentId: resident.id, amountKobo: 500000, discountKobo: 0, status: 'OVERDUE', dueDate: apr.due, periodStart: apr.start, periodEnd: apr.end },
        { residentId: resident.id, amountKobo: 500000, discountKobo: 0, status: 'OVERDUE', dueDate: may.due, periodStart: may.start, periodEnd: may.end },
        { residentId: resident.id, amountKobo: 500000, discountKobo: 0, status: 'PENDING', dueDate: jun.due, periodStart: jun.start, periodEnd: jun.end },
      ],
    });
    console.log(`  ✓ ${resident.name || resident.phoneNumber || resident.email}`);
  }

  console.log(`\nDone — 3 outstanding bills (₦5,000 each) on ${residents.length} account(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

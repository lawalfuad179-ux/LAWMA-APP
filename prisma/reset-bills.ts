import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const residents = await prisma.resident.findMany({
    include: { bills: { include: { payments: true } } },
  });

  console.log(`Found ${residents.length} resident(s)\n`);

  for (const resident of residents) {
    const label = resident.name || resident.phoneNumber || resident.email || resident.id;
    const paidBills = resident.bills.filter(b => b.status === 'PAID');

    if (paidBills.length === 0) {
      console.log(`${label}: no paid bills to reset`);
      continue;
    }

    for (const bill of paidBills) {
      // Delete payments so the bill can be re-paid
      await prisma.payment.deleteMany({ where: { billId: bill.id } });

      const now = new Date();
      const pendingDue = new Date(now);
      pendingDue.setDate(pendingDue.getDate() + 14);

      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          status: 'PENDING',
          dueDate: pendingDue,
        },
      });
    }

    console.log(`${label}: reset ${paidBills.length} paid bill(s) → PENDING, deleted associated payments`);
  }

  // Also create fresh bills for any resident with no unpaid bills
  const now = new Date();
  for (const resident of residents) {
    const label = resident.name || resident.phoneNumber || resident.email || resident.id;
    const refreshed = await prisma.bill.findMany({
      where: { residentId: resident.id, status: { in: ['PENDING', 'OVERDUE'] } },
    });
    if (refreshed.length > 0) continue;

    // Generate 3 months of unpaid bills
    for (let i = 0; i < 3; i++) {
      const monthOffset = i + 1;
      const periodStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + 7);

      await prisma.bill.create({
        data: {
          residentId: resident.id,
          amountKobo: 500000,
          dueDate,
          periodStart,
          periodEnd,
          status: dueDate < now ? 'OVERDUE' : 'PENDING',
        },
      });
    }

    console.log(`${label}: created 3 fresh unpaid bills`);
  }

  console.log('\nDone.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

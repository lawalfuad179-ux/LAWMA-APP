import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Centres named after the facilities the MD said LAWMA already runs
// ("We're starting with our existing facilities like Simpson, Ocean").
const CENTERS = [
  { name: 'Simpson', address: 'Simpson Transfer Station, Lagos Island', lga: 'Lagos Island' },
  { name: 'Ocean', address: 'Ocean Transfer Station, Victoria Island', lga: 'Eti-Osa' },
];

// PLACEHOLDER buy-back rates, in kobo per kg. These are indicative only —
// LAWMA sets the real prices. Rates live in this table rather than in code so
// they can be repriced without a redeploy.
const RATES: { material: 'PLASTIC' | 'PAPER' | 'CARDBOARD' | 'METAL' | 'GLASS'; koboPerKg: number }[] = [
  { material: 'METAL', koboPerKg: 50_000 },   // ₦500/kg
  { material: 'PLASTIC', koboPerKg: 20_000 }, // ₦200/kg
  { material: 'CARDBOARD', koboPerKg: 10_000 }, // ₦100/kg
  { material: 'PAPER', koboPerKg: 8_000 },    // ₦80/kg
  { material: 'GLASS', koboPerKg: 5_000 },    // ₦50/kg
];

// Demo-grade kiosk credentials. Fine for a controlled demo; a real deployment
// issues per-staff codes and passcodes through LAWMA's own staff onboarding.
const OPERATORS = [
  { name: 'Adebayo O.', staffCode: 'SIM01', passcode: '1234', center: 'Simpson' },
  { name: 'Chidinma E.', staffCode: 'OCE01', passcode: '1234', center: 'Ocean' },
];

async function main() {
  console.log('Seeding collection centres...');

  // Upsert-style so re-runs are safe and never clobber real drop-off history.
  const centerIds = new Map<string, string>();
  for (const c of CENTERS) {
    const existing = await prisma.collectionCenter.findFirst({ where: { name: c.name } });
    const row = existing
      ? await prisma.collectionCenter.update({
          where: { id: existing.id },
          data: { address: c.address, lga: c.lga, isActive: true },
        })
      : await prisma.collectionCenter.create({ data: c });
    centerIds.set(c.name, row.id);
    console.log(`  centre: ${row.name} (${row.lga})`);
  }

  for (const r of RATES) {
    await prisma.materialRate.upsert({
      where: { material: r.material },
      update: { koboPerKg: r.koboPerKg, isActive: true },
      create: r,
    });
    console.log(`  rate: ${r.material} = ₦${(r.koboPerKg / 100).toLocaleString('en-NG')}/kg`);
  }

  for (const o of OPERATORS) {
    const centerId = centerIds.get(o.center)!;
    const passcodeHash = await bcrypt.hash(o.passcode, 10);
    await prisma.centerOperator.upsert({
      where: { staffCode: o.staffCode },
      update: { name: o.name, passcodeHash, centerId, isActive: true },
      create: { name: o.name, staffCode: o.staffCode, passcodeHash, centerId },
    });
    console.log(`  operator: ${o.staffCode} (${o.name}) @ ${o.center}`);
  }

  // A known resident for the demo. Unlike a real walk-up (which is
  // passwordless and claimed later via OTP), this one gets a password so the
  // reviewer can sign in to the resident app directly — OTP would need live SMS.
  const demoPhone = '+2348000000001';
  const demoPassword = 'LawmaDemo1!';
  const demoResident = await prisma.resident.upsert({
    where: { phoneNumber: demoPhone },
    update: { name: 'Demo Resident' },
    create: {
      phoneNumber: demoPhone,
      name: 'Demo Resident',
      lga: 'Lagos Island',
      address: '12 Broad Street, Lagos Island',
      onboardingCompletedAt: new Date(),
    },
  });
  await prisma.resident.update({
    where: { id: demoResident.id },
    data: { passwordHash: await bcrypt.hash(demoPassword, 10) },
  });
  console.log(`  demo resident: ${demoResident.name} ${demoPhone} / ${demoPassword}`);

  // One outstanding bill, so the payoff is visible end-to-end: credit earned at
  // the counter is auto-applied against this at payment time (see lib/rewards.ts).
  const existingBill = await prisma.bill.findFirst({
    where: { residentId: demoResident.id, status: { in: ['PENDING', 'OVERDUE'] } },
  });
  if (!existingBill) {
    const now = new Date();
    await prisma.bill.create({
      data: {
        residentId: demoResident.id,
        amountKobo: 500_000, // ₦5,000 monthly waste bill
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: 'PENDING',
      },
    });
    console.log('  demo bill: ₦5,000 pending');
  } else {
    console.log('  demo bill: already present');
  }

  console.log('Collection centre seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

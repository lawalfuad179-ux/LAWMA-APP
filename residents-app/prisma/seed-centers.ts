import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import crypto from 'crypto';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Credentials are supplied by env var, or generated here and printed once.
 * Never hardcoded — this file is committed, and a passcode in git is a
 * passcode in the world. Re-running with the same env vars is idempotent;
 * re-running without them rotates the credentials.
 */
function randomDigits(n: number): string {
  // Rejection-free: read a wide int and mod down. Fine for a demo passcode.
  let out = '';
  for (let i = 0; i < n; i++) out += crypto.randomInt(0, 10).toString();
  return out;
}

function randomPassword(): string {
  // Satisfies the app's strict password rules (upper/lower/digit/special).
  const body = crypto.randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, '');
  return `Lw${body}9!`;
}

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

// One passcode shared by the demo operators, from env or generated.
// A real deployment issues per-staff codes and passcodes through LAWMA's own
// staff onboarding, not a seed script.
const OPERATOR_PASSCODE = process.env.CENTER_DEMO_PASSCODE || randomDigits(6);

const OPERATORS = [
  { name: 'Adebayo O.', staffCode: 'SIM01', center: 'Simpson' },
  { name: 'Chidinma E.', staffCode: 'OCE01', center: 'Ocean' },
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

  const passcodeHash = await bcrypt.hash(OPERATOR_PASSCODE, 10);
  for (const o of OPERATORS) {
    const centerId = centerIds.get(o.center)!;
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
  const demoPassword = process.env.DEMO_RESIDENT_PASSWORD || randomPassword();
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
  console.log(`  demo resident: ${demoResident.name} ${demoPhone}`);

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

  console.log('\nCollection centre seed complete.');
  console.log('─'.repeat(56));
  console.log('TEST CREDENTIALS — printed once, not stored anywhere else');
  console.log('─'.repeat(56));
  console.log(`  Kiosk    /center     staff code SIM01 or OCE01`);
  console.log(`                       passcode   ${OPERATOR_PASSCODE}`);
  console.log(`  Resident /login      phone      0800 000 0001`);
  console.log(`                       password   ${demoPassword}`);
  console.log('─'.repeat(56));
  console.log('Re-run with CENTER_DEMO_PASSCODE / DEMO_RESIDENT_PASSWORD set');
  console.log('to keep these stable. Revoke after the demo: npx tsx prisma/revoke-center-demo.ts');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

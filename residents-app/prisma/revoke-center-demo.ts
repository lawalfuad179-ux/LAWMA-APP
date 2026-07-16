/**
 * Revoke the collection-centre demo access.
 *
 * Run this once the MD demo is over. It deactivates the seeded kiosk operators
 * and clears the demo resident's password, so neither can be signed into any
 * more. It deliberately does NOT delete drop-offs, centres, rates, or the
 * resident record — those are real rows now, and a demo being finished is not a
 * reason to destroy the ledger.
 *
 *   npx tsx prisma/revoke-center-demo.ts
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const operators = await prisma.centerOperator.updateMany({
    where: { staffCode: { in: ['SIM01', 'OCE01'] } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${operators.count} kiosk operator(s).`);

  const resident = await prisma.resident.updateMany({
    where: { phoneNumber: '+2348000000001' },
    data: { passwordHash: null },
  });
  console.log(`Cleared password on ${resident.count} demo resident(s).`);

  // Existing kiosk sessions would otherwise stay valid for their remaining TTL.
  const sessions = await prisma.centerSession.deleteMany({
    where: { operator: { staffCode: { in: ['SIM01', 'OCE01'] } } },
  });
  console.log(`Revoked ${sessions.count} open kiosk session(s).`);

  console.log('\nDemo access revoked. Drop-off history and centres left intact.');
  console.log('Re-enable any time with: npx tsx prisma/seed-centers.ts');
}

main()
  .catch((e) => {
    console.error('Revoke failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

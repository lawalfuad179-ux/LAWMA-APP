import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
];

const PSP_OPERATORS = [
  { name: 'Surulere Environmental Services', zone: 'Central', lgas: ['Surulere', 'Lagos Mainland'] },
  { name: 'Ikeja Waste Management Ltd', zone: 'Central', lgas: ['Ikeja', 'Mushin'] },
  { name: 'Eti-Osa Sanitation Co', zone: 'Coastal', lgas: ['Eti-Osa', 'Lagos Island'] },
  { name: 'Alimosho Cleanup Corp', zone: 'North', lgas: ['Alimosho', 'Ifako-Ijaiye'] },
  { name: 'Agege Waste Services', zone: 'North', lgas: ['Agege', 'Oshodi-Isolo'] },
  { name: 'Ikorodu Environmental Partners', zone: 'East', lgas: ['Ikorodu', 'Kosofe', 'Shomolu'] },
  { name: 'Badagry Waste Solutions', zone: 'West', lgas: ['Badagry', 'Ojo'] },
  { name: 'Lekki Waste Management', zone: 'Coastal', lgas: ['Ibeju-Lekki', 'Epe'] },
  { name: 'Apapa Port Sanitation', zone: 'Coastal', lgas: ['Apapa', 'Amuwo-Odofin'] },
  { name: 'Ajeromi Environmental Services', zone: 'West', lgas: ['Ajeromi-Ifelodun'] },
];

async function main() {
  console.log('Seeding database...');

  // Create PSP operators
  for (const op of PSP_OPERATORS) {
    for (const lga of op.lgas) {
      const operator = await prisma.pspOperator.create({
        data: {
          name: op.name,
          zone: op.zone,
          lga,
          contactPhone: '080 LAWMA PSP',
          email: `${op.name.toLowerCase().replace(/\s+/g, '_')}@lawma.gov.ng`,
        },
      });

      // Create weekly collection schedules for each LGA
      // Most LGAs get 1-2 collection days per week
      const days = lga === 'Lagos Island' ? [1, 4] : lga === 'Surulere' ? [2, 5] : [Math.floor(Math.random() * 5) + 1];

      for (const day of days) {
        await prisma.collectionSchedule.create({
          data: {
            lga,
            dayOfWeek: day,
            windowStart: '08:00',
            windowEnd: '12:00',
            pspOperatorId: operator.id,
          },
        });
      }
    }
  }

  console.log('Seed complete!');
  console.log(`Created ${PSP_OPERATORS.length} PSP operators with collection schedules.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

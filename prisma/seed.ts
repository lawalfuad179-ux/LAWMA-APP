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

  // Clear existing data so re-runs stay clean
  await prisma.collectionSchedule.deleteMany();
  await prisma.pspOperator.deleteMany();

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

  // ── Test resident & bills ──────────────────────────────────────
  const TEST_PHONE = '08012345678';

  const resident = await prisma.resident.upsert({
    where: { phoneNumber: TEST_PHONE },
    update: {},
    create: {
      phoneNumber: TEST_PHONE,
      name: 'Fuad Lawal',
      address: '42 Akerele Street, Surulere',
      lga: 'Surulere',
    },
  });

  // Remove previous test bills so re-runs stay clean
  await prisma.bill.deleteMany({ where: { residentId: resident.id } });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const overdueDue = new Date(now);
  overdueDue.setDate(overdueDue.getDate() - 7);

  await prisma.bill.create({
    data: {
      residentId: resident.id,
      amountKobo: 500000, // ₦5,000
      dueDate: overdueDue,
      periodStart: monthStart,
      periodEnd: monthEnd,
      status: 'OVERDUE',
    },
  });

  // ── Notifications ──────────────────────────────────────────────
  await prisma.notification.deleteMany({ where: { residentId: resident.id } });

  const notificationTemplates: Array<{ title: string; body: string; type: string }> = [
    {
      title: 'Collection Reminder',
      body: 'Your waste collection is scheduled for tomorrow, Friday. Please place your bins outside by 8:00 AM.',
      type: 'COLLECTION_REMINDER',
    },
    {
      title: 'Delayed Pickup',
      body: 'Your scheduled pickup in Surulere has been delayed due to traffic. Our team will arrive within 3 hours.',
      type: 'DELAYED_PICKUP',
    },
    {
      title: 'Complaint Update',
      body: 'Your complaint #LW-202606-A3X9 has been reviewed and assigned to a field officer.',
      type: 'COMPLAINT_UPDATE',
    },
    {
      title: 'Payment Confirmed',
      body: 'Your waste bill payment of ₦5,000 for June 2026 has been confirmed. Thank you!',
      type: 'PAYMENT_CONFIRMATION',
    },
    {
      title: 'Announcement',
      body: 'LAWMA will be conducting a city-wide sanitation exercise on Saturday, June 27. Please cooperate with field officers.',
      type: 'ANNOUNCEMENT',
    },
    {
      title: 'Recycling Reward',
      body: 'Congratulations! You earned 50 points for recycling 3 plastic bottles. Keep up the great work!',
      type: 'RECYCLING_REWARD',
    },
  ];

  // Create notifications over the past 6 days — one per type, newest first
  for (let i = 0; i < notificationTemplates.length; i++) {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - i);

    await prisma.notification.create({
      data: {
        residentId: resident.id,
        title: notificationTemplates[i].title,
        body: notificationTemplates[i].body,
        type: notificationTemplates[i].type as any,
        isRead: i >= 3, // first 3 (newest) unread, rest read
        createdAt,
      },
    });
  }

  console.log('Seed complete!');
  console.log(`Created ${PSP_OPERATORS.length} PSP operators with collection schedules.`);
  console.log(`Created test resident "${resident.name}" (${resident.phoneNumber}) with 1 overdue bill.`);
  console.log(`Created ${notificationTemplates.length} notifications (3 unread, 3 read).`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

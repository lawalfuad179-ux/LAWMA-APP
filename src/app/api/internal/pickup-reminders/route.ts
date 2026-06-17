import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { DAYS_OF_WEEK } from '@/constants';

export async function GET(req: Request) {
  const secret = req.headers.get('x-internal-cron-secret');
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayDow = now.getDay(); // 0=Sun … 6=Sat

    // Find all schedules for today that are SCHEDULED
    const schedules = await db.collectionSchedule.findMany({
      where: { dayOfWeek: todayDow, status: 'SCHEDULED' },
    });

    if (schedules.length === 0) {
      return NextResponse.json({ ok: true, created: 0, message: 'No schedules for today' });
    }

    const lgas = [...new Set(schedules.map((s) => s.lga))];

    // Find residents in those LGAs
    const residents = await db.resident.findMany({
      where: { lga: { in: lgas } },
      select: { id: true, lga: true },
    });

    if (residents.length === 0) {
      return NextResponse.json({ ok: true, created: 0, message: 'No residents in scheduled LGAs' });
    }

    // Idempotency: skip residents who already got a COLLECTION_REMINDER today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await db.notification.findMany({
      where: {
        residentId: { in: residents.map((r) => r.id) },
        type: 'COLLECTION_REMINDER',
        createdAt: { gte: startOfDay },
      },
      select: { residentId: true },
    });

    const alreadyNotified = new Set(existing.map((n) => n.residentId));
    const toNotify = residents.filter((r) => !alreadyNotified.has(r.id));

    if (toNotify.length === 0) {
      return NextResponse.json({ ok: true, created: 0, message: 'All residents already notified today' });
    }

    // Build schedule lookup by LGA for window times
    const scheduleByLga = new Map(schedules.map((s) => [s.lga, s]));

    const dayName = DAYS_OF_WEEK[todayDow];

    await db.notification.createMany({
      data: toNotify.map((r) => {
        const schedule = scheduleByLga.get(r.lga!);
        const window = schedule ? `${schedule.windowStart} – ${schedule.windowEnd}` : 'today';
        return {
          residentId: r.id,
          type: 'COLLECTION_REMINDER',
          title: 'Waste Pickup Today',
          body: `Your waste collection is scheduled for ${dayName} between ${window}. Please place your bins outside before the collection window.`,
          referenceId: schedule?.id ?? null,
        };
      }),
      skipDuplicates: true,
    });

    logger.info('pickup-reminders.sent', { count: toNotify.length, lgas, day: dayName });
    return NextResponse.json({ ok: true, created: toNotify.length });
  } catch (error) {
    logger.error('pickup-reminders.failed', { error: String(error) });
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

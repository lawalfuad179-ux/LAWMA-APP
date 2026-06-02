import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/client';
import { welcomeEmail } from '@/lib/email/templates/welcome';
import { passwordResetEmail } from '@/lib/email/templates/password-reset';
import { complaintSubmittedEmail } from '@/lib/email/templates/complaint-submitted';
import { complaintStatusUpdateEmail } from '@/lib/email/templates/complaint-status-update';
import { paymentConfirmationEmail } from '@/lib/email/templates/payment-confirmation';
import { collectionReminderEmail } from '@/lib/email/templates/collection-reminder';
import { delayedPickupEmail } from '@/lib/email/templates/delayed-pickup';
import { announcementEmail } from '@/lib/email/templates/announcement';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

const renderers: Record<string, (payload: Record<string, unknown>) => { subject: string; text: string; html: string }> = {
  'welcome': (p) => welcomeEmail(p.name as string),
  'password-reset': (p) => passwordResetEmail(p.code as string),
  'complaint-submitted': (p) => complaintSubmittedEmail(p.ticketId as string, p.issueType as string),
  'complaint-status-update': (p) => complaintStatusUpdateEmail(p.ticketId as string, p.status as string),
  'payment-confirmation': (p) => paymentConfirmationEmail(p.amountKobo as number, p.receiptNumber as string),
  'collection-reminder': (p) => collectionReminderEmail(p.dayOfWeek as string, p.windowStart as string, p.windowEnd as string),
  'delayed-pickup': (p) => delayedPickupEmail(p.area as string, (p.reason as string | null) || null),
  'announcement': (p) => announcementEmail(p.title as string, p.body as string),
};

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-cron-secret');
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await db.emailOutbox.findMany({
    where: { status: 'PENDING', attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  let sent = 0;
  let failed = 0;

  for (const email of pending) {
    const render = renderers[email.template];
    if (!render) {
      logger.error('email.dispatch.unknown_template', { template: email.template });
      await db.emailOutbox.update({ where: { id: email.id }, data: { status: 'FAILED', lastError: 'Unknown template' } });
      continue;
    }

    try {
      const { subject, text, html } = render(email.payload as Record<string, unknown>);
      const result = await sendEmail(email.recipient, subject, html, text);

      if (result.ok) {
        await db.emailOutbox.update({ where: { id: email.id }, data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 } } });
        sent++;
      } else {
        await db.emailOutbox.update({ where: { id: email.id }, data: { attempts: { increment: 1 }, lastError: result.error.message } });
        if (email.attempts + 1 >= MAX_ATTEMPTS) {
          await db.emailOutbox.update({ where: { id: email.id }, data: { status: 'FAILED' } });
        }
        failed++;
      }
    } catch (error) {
      logger.error('email.dispatch.error', { id: email.id, error: String(error) });
      await db.emailOutbox.update({ where: { id: email.id }, data: { attempts: { increment: 1 }, lastError: String(error) } });
      if (email.attempts + 1 >= MAX_ATTEMPTS) {
        await db.emailOutbox.update({ where: { id: email.id }, data: { status: 'FAILED' } });
      }
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, remaining: pending.length - sent - failed });
}

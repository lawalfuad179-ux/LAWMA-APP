import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type EmailTemplate = 'welcome' | 'password-reset' | 'complaint-submitted' | 'complaint-status-update' | 'payment-confirmation' | 'collection-reminder' | 'delayed-pickup' | 'announcement';

export async function enqueueEmail(
  recipient: string,
  subject: string,
  template: EmailTemplate,
  payload: Record<string, unknown>,
) {
  try {
    await db.emailOutbox.create({
      data: { recipient, subject, template, payload: payload as any },
    });
    logger.info('email.enqueued', { template, recipient });
  } catch (error) {
    logger.error('email.enqueue_failed', { template, recipient, error: String(error) });
  }
}

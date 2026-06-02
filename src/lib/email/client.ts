import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

export type SendEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: { code: string; message: string } };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendEmailResult> {
  if (process.env.EMAIL_ENABLED !== 'true') {
    logger.info('email.disabled', { to, subject });
    return { ok: true, messageId: 'email-disabled' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"LAWMA" <${process.env.SMTP_FROM_EMAIL || ''}>`,
      to,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'LAWMA Notification Service',
        'X-Entity-Ref-ID': `lawma-${Date.now()}`,
        'List-Unsubscribe': `<mailto:${process.env.SMTP_FROM_EMAIL || ''}>`,
        'Precedence': 'bulk',
      },
    });

    logger.info('email.sent', { to, subject, messageId: info.messageId });
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    logger.error('email.send_failed', { to, subject, error: String(error) });
    return { ok: false, error: { code: 'smtp_error', message: 'Failed to send email.' } };
  }
}

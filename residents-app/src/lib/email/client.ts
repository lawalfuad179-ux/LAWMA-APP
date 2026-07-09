import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

export type SendEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: { code: string; message: string } };

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASSWORD || '';

const transportOptions = {
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  ...(smtpUser && smtpPass ? {
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  } : {}),
};

const transporter = nodemailer.createTransport(transportOptions as nodemailer.TransportOptions);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendEmailResult> {
  const hasCredentials = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const isLocal = !!(process.env.SMTP_HOST && (process.env.SMTP_HOST.includes('localhost') || process.env.SMTP_HOST.includes('127.0.0.1')));
  const hasHost = !!process.env.SMTP_HOST;

  if (process.env.EMAIL_ENABLED !== 'true' || !hasHost || (!hasCredentials && !isLocal)) {
    logger.info('email.mock_sent', {
      to,
      subject,
      message: `[MOCK] Email to ${to}: ${subject} (Text: ${text})`,
    });
    return { ok: true, messageId: 'email-mock-sent' };
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

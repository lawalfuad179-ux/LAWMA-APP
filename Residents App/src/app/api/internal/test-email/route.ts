import { NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email/client';
import { welcomeEmail } from '@/lib/email/templates/welcome';

export async function GET() {
  const to = 'lawmatest@gmail.com';
  const { subject, text, html } = welcomeEmail('Test Resident');

  const result = await sendEmail(to, subject, html, text);

  if (result.ok) {
    return NextResponse.json({ ok: true, messageId: result.messageId, message: 'Test email sent to lawmatest@gmail.com' });
  }

  return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
}

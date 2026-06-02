import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function welcomeEmail(name: string) {
  const subject = 'Welcome to LAWMA';
  const text = `Hi ${name},\n\nYour LAWMA account is ready. You can now check waste collection schedules, report sanitation issues, pay bills, and receive updates.\n\nGo to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 8px;font-size:15px;color:${emailTheme.muted};line-height:1.5">Hi ${name},</p>
<p style="margin:0 0 24px;font-size:15px;color:${emailTheme.text};line-height:1.5">Your LAWMA account is ready. You can now check waste collection schedules, report sanitation issues, pay bills, and receive updates.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">Go to Dashboard</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

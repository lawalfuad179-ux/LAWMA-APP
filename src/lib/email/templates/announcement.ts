import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function announcementEmail(title: string, bodyText: string) {
  const subject = title;
  const text = bodyText;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<h1 style="margin:0 0 16px;font-size:18px;color:${emailTheme.text}">${title}</h1>
<p style="margin:0 0 24px;font-size:15px;color:${emailTheme.muted};line-height:1.5">${bodyText}</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">Go to Dashboard</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

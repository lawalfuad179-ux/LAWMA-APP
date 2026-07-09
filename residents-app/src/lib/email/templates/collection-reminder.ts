import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function collectionReminderEmail(dayOfWeek: string, windowStart: string, windowEnd: string) {
  const subject = 'Waste collection is scheduled for tomorrow';
  const text = `Your waste collection is scheduled for ${dayOfWeek} between ${windowStart} and ${windowEnd}. View your schedule in your LAWMA account.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 8px;font-size:15px;color:${emailTheme.muted}">Your waste collection is scheduled for</p>
<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${emailTheme.text}">${dayOfWeek}</p>
<p style="margin:0 0 24px;font-size:15px;color:${emailTheme.muted}">${windowStart} — ${windowEnd}</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/schedules" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Schedule</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

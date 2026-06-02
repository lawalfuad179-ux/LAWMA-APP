import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function delayedPickupEmail(area: string, reason: string | null) {
  const subject = 'Waste collection in your area has been delayed';
  const text = `Waste collection for ${area} has been delayed${reason ? `: ${reason}` : ''}. Please check the app for updates.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 8px;font-size:15px;color:${emailTheme.text};line-height:1.5">Waste collection in <strong>${area}</strong> has been delayed.</p>
${reason ? `<p style="margin:0 0 24px;font-size:14px;color:${emailTheme.muted}">Reason: ${reason}</p>` : '<p style="margin:0 0 24px">&nbsp;</p>'}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/schedules" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Schedule</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

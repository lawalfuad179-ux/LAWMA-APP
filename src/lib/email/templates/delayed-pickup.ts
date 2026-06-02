import { emailTheme } from '../email-theme';

export function delayedPickupEmail(area: string, reason: string | null) {
  const subject = 'Waste collection in your area has been delayed';
  const text = `Waste collection for ${area} has been delayed${reason ? `: ${reason}` : ''}. Please check the app for updates.`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="padding:32px 32px 0;text-align:center">
<h1 style="margin:0 0 8px;font-size:20px;color:${emailTheme.text}">Collection delayed</h1>
<p style="margin:0 0 8px;font-size:15px;color:${emailTheme.muted};line-height:1.5">
Waste collection in <strong>${area}</strong> has been delayed.
</p>
${reason ? `<p style="margin:0 0 24px;font-size:14px;color:${emailTheme.muted}">Reason: ${reason}</p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/schedules" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Schedule</a>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;font-size:13px;color:${emailTheme.muted}">
LAWMA — Lagos Waste Management Authority
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

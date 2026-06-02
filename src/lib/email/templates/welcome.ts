import { emailTheme } from '../email-theme';

export function welcomeEmail(name: string) {
  const subject = 'Welcome to LAWMA';
  const text = `Hi ${name},\n\nYour LAWMA account is ready. You can now check waste collection schedules, report sanitation issues, pay bills, and receive updates.\n\nGo to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="padding:32px 32px 0;text-align:center">
<img src="https://lawma.gov.ng/logo.png" alt="LAWMA" width="120" style="margin-bottom:16px"/>
<h1 style="margin:0 0 8px;font-size:20px;color:${emailTheme.text}">Welcome to LAWMA</h1>
<p style="margin:0 0 24px;font-size:15px;color:${emailTheme.muted};line-height:1.5">
Hi ${name},<br/><br/>
Your LAWMA account is ready. You can now check waste collection schedules, report sanitation issues, pay bills, and receive updates.
</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">Go to Dashboard</a>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;font-size:13px;color:${emailTheme.muted}">
LAWMA — Lagos Waste Management Authority<br/>
If you did not create this account, please ignore this email.
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

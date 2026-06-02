import { emailTheme } from '../email-theme';

export function complaintStatusUpdateEmail(ticketId: string, status: string) {
  const subject = 'Your LAWMA report status has changed';
  const text = `Your report ${ticketId} is now ${status.replace(/_/g, ' ')}. View details in your LAWMA account.`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="padding:32px 32px 0;text-align:center">
<h1 style="margin:0 0 8px;font-size:20px;color:${emailTheme.text}">Report status update</h1>
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.muted};line-height:1.5">
Your report <strong>${ticketId}</strong> has been updated.
</p>
<div style="padding:12px;background:${emailTheme.surface};border-radius:${emailTheme.radius};margin-bottom:24px;font-size:16px;font-weight:600;color:${emailTheme.brand}">${status.replace(/_/g, ' ')}</div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/complaints" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Report</a>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;font-size:13px;color:${emailTheme.muted}">
LAWMA — Lagos Waste Management Authority
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

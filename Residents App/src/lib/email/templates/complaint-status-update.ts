import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function complaintStatusUpdateEmail(ticketId: string, status: string) {
  const subject = 'Your LAWMA report status has changed';
  const text = `Your report ${ticketId} is now ${status.replace(/_/g, ' ')}. View details in your LAWMA account.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.text};line-height:1.5">Your report <strong>${ticketId}</strong> has been updated.</p>
<div style="padding:12px;background:${emailTheme.surface};border:1px solid ${emailTheme.border};border-radius:${emailTheme.radius};margin-bottom:24px;font-size:16px;font-weight:600;color:${emailTheme.brand}">${status.replace(/_/g, ' ')}</div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/complaints" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Report</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

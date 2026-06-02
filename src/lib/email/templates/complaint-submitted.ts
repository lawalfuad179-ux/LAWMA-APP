import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function complaintSubmittedEmail(ticketId: string, issueType: string) {
  const subject = 'Your LAWMA report has been submitted';
  const text = `We received your report. Your ticket number is ${ticketId}. You can track the progress from your complaint page.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 8px;font-size:15px;color:${emailTheme.text};line-height:1.5">We received your report regarding <strong>${issueType.replace(/_/g, ' ')}</strong>.</p>
<div style="padding:12px;background:${emailTheme.surface};border:1px solid ${emailTheme.border};border-radius:${emailTheme.radius};margin:16px 0 24px;font-size:14px;color:${emailTheme.brand};font-weight:600">Ticket: ${ticketId}</div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/complaints" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Reports</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function passwordResetEmail(code: string) {
  const subject = 'Your LAWMA verification code';
  const text = `Your LAWMA verification code is: ${code}\n\nThis code expires in 5 minutes. If you did not request this, please ignore this email.\n\nLAWMA — Lagos Waste Management Authority`;

  const body = `<tr><td style="padding:32px 32px 24px">
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.text};line-height:1.5">Your LAWMA verification code is:</p>
<div style="padding:20px;background:${emailTheme.surface};border:1px solid ${emailTheme.border};border-radius:${emailTheme.radius};text-align:center;font-size:32px;font-weight:700;letter-spacing:6px;color:${emailTheme.text};font-family:Courier,monospace">${code}</div>
<p style="margin:16px 0 0;font-size:14px;color:${emailTheme.muted};line-height:1.5">This code expires in 5 minutes. If you did not request this, you can safely ignore this email.</p>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

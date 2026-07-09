import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

export function paymentConfirmationEmail(amountKobo: number, receiptNumber: string) {
  const amount = `NGN ${(amountKobo / 100).toLocaleString()}`;
  const subject = 'Your LAWMA payment was successful';
  const text = `Your payment of ${amount} has been verified. Receipt: ${receiptNumber}. View your receipt in your LAWMA account.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.text};line-height:1.5">Your waste bill payment has been verified successfully.</p>
<div style="padding:16px;background:${emailTheme.surface};border:1px solid ${emailTheme.border};border-radius:${emailTheme.radius};margin-bottom:20px">
<p style="margin:0 0 4px;font-size:24px;font-weight:700;color:${emailTheme.brand}">${amount}</p>
<p style="margin:0;font-size:13px;color:${emailTheme.muted}">Receipt: ${receiptNumber}</p>
</div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Payment History</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

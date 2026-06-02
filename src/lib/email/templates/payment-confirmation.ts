import { emailTheme } from '../email-theme';

export function paymentConfirmationEmail(amountKobo: number, receiptNumber: string) {
  const amount = `₦${(amountKobo / 100).toLocaleString()}`;
  const subject = 'Your LAWMA payment was successful';
  const text = `Your payment of ${amount} has been verified. Receipt: ${receiptNumber}. View your receipt in your LAWMA account.`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="padding:32px 32px 0;text-align:center">
<h1 style="margin:0 0 8px;font-size:20px;color:${emailTheme.text}">Payment successful</h1>
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.muted};line-height:1.5">
Your waste bill payment has been verified successfully.
</p>
<div style="padding:16px;background:${emailTheme.surface};border-radius:${emailTheme.radius};margin-bottom:20px">
<p style="margin:0 0 4px;font-size:24px;font-weight:700;color:${emailTheme.brand}">${amount}</p>
<p style="margin:0;font-size:13px;color:${emailTheme.muted}">Receipt: ${receiptNumber}</p>
</div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Payment History</a>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;font-size:13px;color:${emailTheme.muted}">
LAWMA — Lagos Waste Management Authority
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

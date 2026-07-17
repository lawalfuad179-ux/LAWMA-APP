import { emailTheme } from '../email-theme';
import { emailLayout } from '../layout';

/**
 * Sent after a collection-centre drop-off. Two shapes:
 * CREDIT — the wallet grew; lead with the new balance and the bill payoff.
 * CASH — money was handed over; this is the paper trail, no balance line.
 */
export function recyclingRewardEmail(
  amountKobo: number,
  summary: string,
  centerName: string,
  receiptCode: string,
  payoutMethod: 'CREDIT' | 'CASH',
  newBalancePoints: number,
) {
  const amount = `NGN ${(amountKobo / 100).toLocaleString()}`;
  const isCredit = payoutMethod === 'CREDIT';

  const subject = isCredit
    ? `You earned ${amount} recycling at ${centerName}`
    : `Your ${amount} cash payout at ${centerName}`;

  const text = isCredit
    ? `Your drop-off (${summary}) at ${centerName} earned ${amount}. It's in your reward wallet (balance: NGN ${newBalancePoints.toLocaleString()}) and will come off your next waste bill automatically. Receipt: ${receiptCode}.`
    : `Your drop-off (${summary}) at ${centerName} was paid out as ${amount} cash at the counter. Receipt: ${receiptCode}.`;

  const body = `<tr><td style="padding:32px 32px 24px;text-align:center">
<p style="margin:0 0 16px;font-size:15px;color:${emailTheme.text};line-height:1.5">${
    isCredit
      ? `Thanks for recycling! Your drop-off at <strong>${centerName}</strong> just earned you credit.`
      : `Thanks for recycling! Here is the record of your cash payout at <strong>${centerName}</strong>.`
  }</p>
<div style="padding:16px;background:${emailTheme.surface};border:1px solid ${emailTheme.border};border-radius:${emailTheme.radius};margin-bottom:20px">
<p style="margin:0 0 4px;font-size:24px;font-weight:700;color:${emailTheme.brand}">${amount}</p>
<p style="margin:0 0 4px;font-size:13px;color:${emailTheme.muted}">${summary}</p>
<p style="margin:0;font-size:13px;color:${emailTheme.muted}">Receipt: ${receiptCode}</p>
</div>
${
    isCredit
      ? `<p style="margin:0 0 20px;font-size:14px;color:${emailTheme.text}">Wallet balance: <strong>NGN ${newBalancePoints.toLocaleString()}</strong> — it comes off your next waste bill automatically.</p>`
      : ''
  }
<a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" style="display:inline-block;padding:12px 32px;background:${emailTheme.brand};color:${emailTheme.white};text-decoration:none;border-radius:${emailTheme.radius};font-weight:600;font-size:15px">View Reward Wallet</a>
</td></tr>`;

  return { subject, text, html: emailLayout(body) };
}

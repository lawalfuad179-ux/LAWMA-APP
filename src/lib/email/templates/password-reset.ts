import { emailTheme } from '../email-theme';

export function passwordResetEmail(code: string) {
  const subject = 'Reset your LAWMA password';
  const text = `Your LAWMA password reset code is: ${code}\n\nThis code expires in 5 minutes. If you did not request this, please ignore this email.`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="padding:32px 32px 0;text-align:center">
<h1 style="margin:0 0 8px;font-size:20px;color:${emailTheme.text}">Reset your password</h1>
<p style="margin:0 0 24px;font-size:15px;color:${emailTheme.muted};line-height:1.5">
Use the code below to reset your LAWMA password. This code expires in 5 minutes.
</p>
<div style="padding:16px;background:${emailTheme.surface};border-radius:${emailTheme.radius};margin-bottom:24px;font-size:28px;font-weight:700;letter-spacing:8px;color:${emailTheme.brand};text-align:center">${code}</div>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;font-size:13px;color:${emailTheme.muted}">
If you did not request a password reset, please ignore this email.
</td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

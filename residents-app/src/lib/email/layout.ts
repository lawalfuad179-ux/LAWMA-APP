import { emailTheme } from './email-theme';

export function emailLayout(content: string, footerSuffix?: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${emailTheme.surface};font-family:${emailTheme.fontFamily}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="background:${emailTheme.white};border-radius:${emailTheme.radius};overflow:hidden">
<tr><td style="background:${emailTheme.brand};padding:16px 32px;text-align:center">
<h1 style="margin:0;font-size:16px;color:${emailTheme.white};font-weight:600;letter-spacing:1px">LAWMA</h1>
</td></tr>
${content}
<tr><td style="padding:0 32px 32px;text-align:center;font-size:12px;color:${emailTheme.muted};line-height:1.5">
LAWMA — Lagos Waste Management Authority<br>Lagos, Nigeria${footerSuffix ? `<br>${footerSuffix}` : ''}
</td></tr></table></td></tr></table></body></html>`;
}

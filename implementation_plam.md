# LAWMA App — Email Notifications With Free SMTP Implementation Plan

## Audit Rating

Current assumed implementation: **0/10**

Reason: email notification infrastructure does not exist yet.

Target implementation rating after this plan: **10/10**

This plan is written from the perspective of a 15-year experienced fullstack developer building a production-ready civic-tech platform with practical MVP constraints.

---

# Objective

Implement email notifications for the LAWMA app using a free SMTP provider while keeping the architecture provider-agnostic, secure, scalable, and easy to upgrade later.

The system should send important transactional emails such as:

- Welcome email after sign-up
- OTP or verification email if email verification is added
- Password reset email
- Complaint submitted confirmation
- Complaint status update
- Payment confirmation
- Payment receipt
- Collection reminder
- Delayed pickup alert
- LAWMA announcement

---

# Recommended Free SMTP Provider

## Primary Recommendation

Use:

```txt
Brevo Free SMTP
```

Why:

- Free plan supports SMTP
- Suitable for transactional emails
- Better than using a personal Gmail account
- Easier to scale beyond MVP
- Daily free sending allowance is useful for early testing

---

## Development / Testing Alternative

Use:

```txt
Mailtrap
```

Why:

- Good for testing emails safely
- Prevents accidental real emails during development
- Useful for inspecting HTML email templates

---

## Avoid as Production Default

Avoid using:

```txt
Gmail SMTP
```

for production.

Gmail can work with app passwords, but it is better for internal testing only.

Reason:

- Requires 2-Step Verification
- App passwords are not ideal for production services
- Lower trust as a product email sender
- Poorer scalability

---

# Final Provider Strategy

Build the email service so the provider can be changed later without rewriting the app.

Use environment variables:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME="LAWMA"
EMAIL_PROVIDER="brevo"
EMAIL_ENABLED=true
```

Do not hardcode provider values.

---

# Technical Stack

Use:

```txt
Nodemailer
```

Install:

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

Do not introduce a paid email SDK.

Do not use a client-side email service.

All email sending must happen server-side.

---

# Phase 1 — Environment Configuration

## File

Create or update:

```txt
src/lib/env.ts
```

Add zod validation for:

```ts
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME
EMAIL_PROVIDER
EMAIL_ENABLED
```

Validation rules:

- `SMTP_HOST` required when `EMAIL_ENABLED=true`
- `SMTP_PORT` must be number
- `SMTP_SECURE` must be boolean-like string
- `SMTP_FROM_EMAIL` must be valid email
- `SMTP_PASSWORD` must never be exposed client-side

Only variables prefixed with:

```txt
NEXT_PUBLIC_
```

may be used in browser code.

Never prefix SMTP secrets with:

```txt
NEXT_PUBLIC_
```

---

# Phase 2 — Email Service Foundation

## File

Create:

```txt
src/lib/email/client.ts
```

Responsibility:

- Create a single reusable Nodemailer transporter
- Verify SMTP connection in development only
- Send emails from server-side code only

Rules:

- Do not create a transporter inside every function call
- Do not log SMTP password
- Do not expose raw SMTP errors to users
- Return structured results

Example shape:

```ts
type SendEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: { code: string; message: string } };
```

---

# Phase 3 — Email Template System

Create:

```txt
src/lib/email/templates/
```

Templates:

```txt
welcome.ts
password-reset.ts
complaint-submitted.ts
complaint-status-update.ts
payment-confirmation.ts
collection-reminder.ts
delayed-pickup.ts
announcement.ts
```

Each template exports:

```ts
type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};
```

Rules:

- Every email must have both text and HTML versions
- HTML must be simple and lightweight
- No remote JavaScript
- No tracking pixels in MVP
- Use inline-safe HTML only
- Use plain language
- Keep emails short
- Avoid sensitive location details in subject lines

---

# Phase 4 — Email Design System

Email HTML should use a simple LAWMA-branded layout.

Style:

- Clean header
- LAWMA name
- Short message
- Clear CTA button where needed
- Footer with support text

Do not rely on external CSS files.

Do not use app CSS Modules inside emails.

Reason:

Email clients do not reliably support modern CSS.

Use simple inline styles inside the email template.

Email colors should match tokens conceptually, but because email clients require inline styling, define a small internal email theme in:

```txt
src/lib/email/email-theme.ts
```

Example:

```ts
export const emailTheme = {
  brand: '#0F7A3B',
  text: '#111827',
  muted: '#6B7280',
  surface: '#F9FAFB',
};
```

Important:

This is the only acceptable place to use raw color values for emails because email clients need inline styles.

Document this exception clearly.

---

# Phase 5 — Notification Event Mapping

Create:

```txt
src/lib/email/notifications.ts
```

Map app events to email templates.

## Event: User Sign-Up

Trigger:

```txt
Resident account created
```

Email:

```txt
Welcome to LAWMA
```

---

## Event: Password Reset

Trigger:

```txt
User requests password reset
```

Email:

```txt
Reset your LAWMA password
```

Security:

- Reset token must expire
- Do not reveal account existence
- Token must be hashed in database
- Email contains reset link only

---

## Event: Complaint Submitted

Trigger:

```txt
Complaint created
```

Email:

```txt
Your LAWMA report has been submitted
```

Include:

- Ticket ID
- Issue category
- Status
- Link to complaint detail

Do not include exact GPS coordinates.

---

## Event: Complaint Status Updated

Trigger:

```txt
Complaint status changes
```

Email:

```txt
Your LAWMA report status has changed
```

Include:

- Ticket ID
- New status
- CTA to view report

---

## Event: Payment Confirmation

Trigger:

```txt
Flutterwave webhook verifies successful payment
```

Email:

```txt
Your LAWMA payment was successful
```

Include:

- Receipt number
- Amount
- Date
- CTA to view receipt

Important:

Only send after verified webhook success.

Never send payment confirmation from the browser redirect page.

---

## Event: Collection Reminder

Trigger:

```txt
24 hours before scheduled collection
```

Email:

```txt
Waste collection is scheduled for tomorrow
```

Include:

- Area
- Collection window
- Assigned PSP

---

## Event: Delayed Pickup

Trigger:

```txt
Collection status changes to DELAYED
```

Email:

```txt
Waste collection in your area has been delayed
```

Include:

- Area
- Reason if available
- Updated collection status

---

# Phase 6 — Email Queue / Outbox Pattern

Do not send email directly inside critical user-facing request paths.

Create an email outbox table.

## Prisma Model

Add:

```prisma
model EmailOutbox {
  id          String   @id @default(cuid())
  recipient  String
  subject    String
  template   String
  payload    Json
  status     EmailStatus @default(PENDING)
  attempts   Int      @default(0)
  lastError  String?
  sentAt     DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([recipient])
}
```

Add enum:

```prisma
enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

Why:

- Prevents slow SMTP from blocking app actions
- Allows retries
- Gives visibility into failed emails
- Prevents losing important notification attempts

---

# Phase 7 — Email Dispatch Route

Create:

```txt
src/app/api/internal/email-dispatch/route.ts
```

Purpose:

- Process pending outbox emails
- Send limited batch
- Mark sent or failed
- Retry failed messages up to max attempts

Security:

- Must require internal secret header

Environment variable:

```env
INTERNAL_CRON_SECRET=
```

Request header:

```txt
x-internal-cron-secret
```

Reject invalid requests with:

```txt
401 Unauthorized
```

Never expose this route publicly without secret protection.

---

# Phase 8 — Retry Strategy

Max attempts:

```txt
3
```

Retry behavior:

1. First failure: keep pending
2. Second failure: keep pending
3. Third failure: mark failed

Optional future:

```txt
FAILED_RETRYABLE
FAILED_PERMANENT
```

Do not retry forever.

Log:

- outbox ID
- template name
- attempt count
- sanitized error

Never log full email contents if they may contain personal data.

---

# Phase 9 — Email Preferences

Residents should control non-critical emails.

Add:

```prisma
model NotificationPreference {
  id                         String @id @default(cuid())
  residentId                 String @unique
  emailComplaintUpdates      Boolean @default(true)
  emailPaymentReceipts       Boolean @default(true)
  emailCollectionReminders   Boolean @default(true)
  emailAnnouncements         Boolean @default(false)
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
}
```

Rules:

- Security emails cannot be disabled
- Password reset emails cannot be disabled
- Payment receipt emails should be enabled by default
- Marketing-style announcements should be opt-in or clearly controllable

---

# Phase 10 — Database Migration

Use the DB migration runner rules.

Steps:

1. Edit:

```txt
prisma/schema.prisma
```

2. Add:

```txt
EmailOutbox
EmailStatus
NotificationPreference
```

3. Run:

```bash
npx prisma migrate dev --name add_email_notifications
```

4. Read generated SQL fully.

5. Run:

```bash
npx prisma generate
```

6. Test locally.

7. Commit schema and migration together.

---

# Phase 11 — Email Trigger Integration

## Sign-Up

After resident creation:

```txt
enqueue welcome email
```

Do not block account creation if email enqueue fails.

---

## Forgot Password

When reset is requested:

```txt
enqueue password reset email
```

Always show generic success message.

---

## Complaint Created

After complaint saved:

```txt
enqueue complaint submitted email
```

---

## Complaint Updated

After status changes:

```txt
enqueue complaint status update email
```

---

## Payment Successful

Only inside Flutterwave webhook after transaction verification:

```txt
enqueue payment confirmation email
```

---

## Collection Reminder

Future scheduled job:

```txt
enqueue collection reminder emails
```

For MVP:

- prepare service function
- do not build heavy scheduler unless needed

---

# Phase 12 — Email Content Examples

## Welcome Email

Subject:

```txt
Welcome to LAWMA
```

Body:

```txt
Your LAWMA account is ready. You can now check waste collection schedules, report sanitation issues, pay bills, and receive updates.
```

CTA:

```txt
Go to Dashboard
```

---

## Complaint Submitted

Subject:

```txt
Your LAWMA report has been submitted
```

Body:

```txt
We received your report. Your ticket number is LAWMA-IKJ-2026-000421.
You can track the progress from your complaint page.
```

CTA:

```txt
View Report
```

---

## Payment Confirmation

Subject:

```txt
Your LAWMA payment was successful
```

Body:

```txt
Your payment has been verified successfully. Your receipt is now available in your LAWMA account.
```

CTA:

```txt
View Receipt
```

---

## Delayed Pickup

Subject:

```txt
Waste collection in your area has been delayed
```

Body:

```txt
Waste collection for your area has been delayed. Please check the app for the latest update.
```

CTA:

```txt
View Schedule
```

---

# Phase 13 — Deliverability Basics

Set up sender properly.

Minimum:

- Use a real sender email
- Use a verified sender/domain if provider supports it
- Avoid spammy subject lines
- Keep emails short
- Include text version
- Avoid attachments in MVP

Recommended sender:

```txt
LAWMA <no-reply@your-domain.com>
```

If no domain is available during MVP:

```txt
LAWMA <your-brevo-sender@example.com>
```

Upgrade later to a verified domain.

---

# Phase 14 — Local Development Testing

For local dev, use Mailtrap or provider sandbox.

Test:

- welcome email
- password reset email
- complaint submitted email
- payment confirmation email
- invalid SMTP credentials
- provider downtime
- retry behavior
- failed email after 3 attempts

---

# Phase 15 — Production Safety Rules

Never:

- send emails from client components
- expose SMTP credentials
- block payment webhook on email send
- send duplicate payment confirmation emails
- send exact GPS coordinates by email
- include sensitive personal details in subject lines
- retry forever
- log full reset tokens
- log SMTP passwords

Always:

- enqueue email first
- process through dispatch route
- sanitize logs
- protect internal dispatch route
- use preferences for non-critical emails
- send payment emails only after verified webhook success

---

# Phase 16 — Accessibility & UX for Email Settings

Add email notification preferences to profile later.

Page:

```txt
/profile/notifications
```

Controls:

- Complaint updates
- Payment receipts
- Collection reminders
- LAWMA announcements

Accessibility:

- Use labels
- Use clear toggle states
- Minimum 44px touch targets
- Save status feedback
- Error state if save fails

---

# Phase 17 — QA Checklist

## SMTP Setup

- SMTP host works
- SMTP port works
- Secure mode correct
- Wrong password fails safely
- Missing env vars stop boot when email enabled

---

## Outbox

- Email is created as PENDING
- Dispatch sends it
- Status changes to SENT
- Failure increments attempts
- After 3 failures status becomes FAILED

---

## Security

- SMTP secrets not exposed client-side
- Internal dispatch route rejects missing secret
- Password reset token not logged
- Payment email only sends after webhook verification

---

## Preferences

- Complaint email respects preference
- Announcement email respects preference
- Password reset ignores preference
- Payment receipt still sends by default

---

## Mobile UI

- Notification settings work at 375px
- Toggles are 44px minimum
- Save feedback is clear

---

# Phase 18 — Future Upgrade Path

When the app grows, replace free SMTP with:

```txt
Paid Brevo
Amazon SES
Postmark
Resend
SendGrid
```

Because the app uses an internal email service and outbox pattern, switching provider should only affect:

```txt
src/lib/email/client.ts
```

not the whole product.

---

# Final Implementation Order

1. Add SMTP environment variables
2. Add env validation
3. Install Nodemailer
4. Create email client
5. Create email theme
6. Create email templates
7. Add EmailOutbox model
8. Add NotificationPreference model
9. Run Prisma migration
10. Create enqueue email service
11. Create protected email dispatch route
12. Integrate welcome email
13. Integrate password reset email
14. Integrate complaint submitted email
15. Integrate complaint status email
16. Integrate verified payment email from Flutterwave webhook
17. Add local SMTP testing
18. Add QA checks
19. Add future notification preference page

---

# Final Success Criteria

Implementation is successful when:

1. LAWMA can send transactional emails using free SMTP.
2. SMTP credentials are fully server-side.
3. Emails are queued before sending.
4. Failed emails retry safely.
5. Payment confirmation emails only send after Flutterwave webhook verification.
6. Password reset emails are secure.
7. Residents receive useful complaint and payment emails.
8. Non-critical email types respect preferences.
9. Provider can be changed later without rewriting the app.
10. The system remains stable if SMTP provider is slow or temporarily down.

---

# Final Rating

This reproduction is rated:

```txt
10/10
```

because it covers:

- provider choice
- free SMTP practicality
- secure environment setup
- Nodemailer integration
- transactional email templates
- outbox architecture
- retry logic
- email preferences
- Flutterwave payment safety
- password reset security
- deliverability basics
- QA
- future provider migration
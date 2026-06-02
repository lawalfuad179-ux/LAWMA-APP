# LAWMA App — Authentication & Interactive Onboarding System Implementation Plan

## Objective

Create a production-grade authentication and onboarding experience that:

- Maximizes sign-up completion rates
- Minimizes user friction
- Supports low-tech Lagos residents
- Works reliably on low-end Android devices
- Meets WCAG AA accessibility standards
- Supports future authentication methods
- Provides an interactive product walkthrough
- Uses realtime validation
- Supports interruption recovery
- Is scalable for future LAWMA releases

---

# Success Metrics

Target:

- Sign-up completion rate > 85%
- Tutorial completion rate > 70%
- Login success rate > 95%
- Password reset completion rate > 80%
- WCAG AA compliance
- Mobile usability on 375px viewport
- Average onboarding completion under 3 minutes

---

# Phase 1 — Authentication Architecture Review

## Existing Routes

Audit and improve:

```txt
/login
/signup
/forgot-password
```

Create if missing:

```txt
/reset-password
/welcome
```

---

# Phase 2 — Progressive Sign-Up Experience

Do NOT show all fields at once.

Research consistently shows shorter perceived forms improve completion rates.

## Step 1 — Account Creation

Fields:

```txt
Full Name
Phone Number
Password
Confirm Password
```

Validation:

### Full Name

Requirements:

```txt
Required
Minimum 2 characters
Maximum 100 characters
```

Realtime validation:

```txt
Enter your full name.
```

### Phone Number

Requirements:

```txt
Required
Accept:
080...
070...
081...
090...
+234...
```

Normalize internally:

```txt
+234XXXXXXXXXX
```

Error:

```txt
Enter a valid Nigerian phone number.
```

### Password

Requirements:

```txt
Minimum 8 characters
At least 1 letter
At least 1 number
```

Error:

```txt
Use at least 8 characters with a letter and a number.
```

### Confirm Password

Error:

```txt
Passwords do not match.
```

---

## Step 2 — Verification

Future-ready:

```txt
OTP verification
```

If OTP not implemented:

Skip gracefully.

Architecture must support later migration.

---

## Step 3 — Resident Setup

Fields:

```txt
LGA
Street Address
```

Validation:

### LGA

Required.

Use dropdown.

### Address

Requirements:

```txt
Minimum 5 characters
Maximum 250 characters
```

---

## Step 4 — Interactive Product Tour

Immediately after successful signup.

Redirect:

```txt
/welcome
```

---

# Phase 3 — Sign-In Experience

## Fields

```txt
Phone Number
Password
```

---

## UX Improvements

Add:

- Show password
- Forgot password
- Create account link
- Loading state
- Success state
- Error state

---

## Generic Authentication Error

Never reveal:

```txt
Phone number not found
```

Use:

```txt
We could not sign you in.
Check your phone number and password.
```

---

# Phase 4 — Forgot Password Flow

## Step 1

User enters:

```txt
Phone Number
or
Email
```

---

## Step 2

Send:

```txt
Reset code
```

or

```txt
Reset link
```

---

## Step 3

User enters:

```txt
Verification code
New password
Confirm password
```

---

## Security Response

Always return:

```txt
If an account exists, we’ll send reset instructions.
```

Never reveal account existence.

---

# Phase 5 — Realtime Validation System

## Shared Validation

Create:

```txt
src/lib/validators/auth.ts
```

Schemas:

```ts
signUpSchema
signInSchema
forgotPasswordSchema
resetPasswordSchema
```

Use same schemas:

- Client
- Server Actions
- Route Handlers

---

## Validation Behavior

### On Blur

Validate field.

### After Error

Validate while typing.

### On Submit

Focus first invalid field.

### Success Feedback

Show only when useful.

Avoid excessive green checkmarks.

---

# Phase 6 — Mobile Form Optimization

## Phone Number Input

Use:

```html
<input
  inputMode="tel"
  autoComplete="tel"
/>
```

---

## Email

```html
<input
  inputMode="email"
  autoComplete="email"
/>
```

---

## New Password

```html
<input
  autoComplete="new-password"
/>
```

---

## Current Password

```html
<input
  autoComplete="current-password"
/>
```

---

## Return Key Navigation

Enter should:

```txt
Move to next field
```

or

```txt
Submit final form
```

when valid.

---

# Phase 7 — Accessibility Standards

All auth forms must meet WCAG AA.

---

## Labels

Every input requires:

```tsx
<label htmlFor="">
```

Never rely on placeholders.

---

## Error Messaging

Use:

```txt
aria-describedby
```

Example:

```tsx
<input aria-describedby="phone-error" />
```

---

## Validation Announcements

Use:

```txt
aria-live="polite"
```

---

## Submit Errors

Use:

```txt
role="alert"
```

---

## Focus Management

Support:

- keyboard navigation
- focus visibility
- focus restoration
- focus trapping where required

---

## Password Visibility Toggle

Must be accessible.

Screen reader labels:

```txt
Show Password
Hide Password
```

---

## Reduced Motion

Support:

```css
prefers-reduced-motion
```

for animations.

---

# Phase 8 — Security Hardening

## Login Rate Limiting

Allow:

```txt
5 failed attempts
```

within:

```txt
15 minutes
```

Then:

```txt
Too many attempts.
Please try again later.
```

---

## Session Security

Cookies:

```txt
httpOnly
secure
sameSite=lax
```

---

## Session Lifetime

Default:

```txt
30 days
```

Expire inactive sessions.

---

## Session Invalidation

Logout must:

- remove session
- invalidate server-side token

---

# Phase 9 — Interactive Product Tour

Replace static onboarding slides.

Users should learn the product itself.

---

## Step 1

Highlight:

```txt
Next Pickup Card
```

Copy:

```txt
See your next collection day and stay updated.
```

---

## Step 2

Highlight:

```txt
Report Issue
```

Copy:

```txt
Report missed pickups, illegal dumping, or sanitation issues.
```

---

## Step 3

Highlight:

```txt
Pay Bills
```

Copy:

```txt
Pay securely through Flutterwave and receive digital receipts.
```

---

## Step 4

Highlight:

```txt
Notifications
```

Copy:

```txt
Receive collection reminders and complaint updates.
```

---

## Final Screen

CTA:

```txt
Go To Dashboard
```

Secondary:

```txt
Skip
```

---

# Phase 10 — Onboarding Persistence

Replace:

```prisma
hasCompletedOnboarding Boolean
```

With:

```prisma
onboardingVersion Int @default(0)
onboardingCompletedAt DateTime?
```

Current version:

```txt
1
```

Benefits:

- Future onboarding updates
- What's New experiences
- Versioned education flows

---

# Phase 11 — Onboarding API

Create:

```txt
/api/onboarding/complete
```

Behavior:

- authenticate user
- save onboardingVersion
- save onboardingCompletedAt

Response:

```ts
{
  ok: true,
  data: {
    completed: true
  }
}
```

---

# Phase 12 — Session Recovery & Interruption Recovery

## Save Progress

Persist:

```txt
Current signup step
Current onboarding step
```

to local storage.

---

## Restore Progress

If interrupted:

```txt
Continue where you left off.
```

---

## Network Failure

Display:

```txt
Connection lost.
Your progress has been saved.
```

---

# Phase 13 — Empty State System

Create:

```txt
src/components/shared/EmptyState.tsx
```

Variants:

### No Complaints

```txt
You have not submitted any reports yet.
```

### No Notifications

```txt
You do not have any notifications yet.
```

### No Payments

```txt
No payment records found.
```

### No Schedule

```txt
We are still assigning a collection schedule for your area.
```

---

# Phase 14 — Analytics Instrumentation

Track:

```txt
signup_started
signup_completed
signup_abandoned

login_success
login_failed

password_reset_requested
password_reset_completed

tutorial_started
tutorial_completed
tutorial_skipped

dashboard_first_visit
```

Create:

```txt
src/lib/analytics/
```

All events should go through one analytics service.

---

# Phase 15 — Future Authentication Readiness

Do not build yet.

Prepare architecture for:

```txt
OTP Login
Google Login
Apple Login
Multi-Factor Authentication
```

Current implementation should not block future support.

---

# Phase 16 — UI Design Requirements

Use:

- CSS Modules
- Design Tokens
- Mobile-first layouts
- 44px touch targets
- Accessible focus states

Do NOT use:

- Tailwind
- Hardcoded colors
- Hardcoded typography
- Inline styles
- Heavy animations

---

# Phase 17 — QA & Testing

## Sign-Up

Test:

- Empty form
- Invalid phone
- Invalid password
- Duplicate account
- Network failure

---

## Login

Test:

- Invalid credentials
- Locked account
- Session expiry

---

## Password Reset

Test:

- Expired code
- Invalid code
- Successful reset

---

## Onboarding

Test:

- New user
- Returning user
- Skip flow
- Resume flow
- Refresh page
- Mobile responsiveness

---

## Accessibility

Verify:

- Keyboard-only navigation
- Screen readers
- Focus visibility
- Contrast
- Reduced motion

---

# Final Success Criteria

A new resident should be able to:

1. Create an account in under 2 minutes.
2. Understand LAWMA's core features in under 60 seconds.
3. Complete onboarding without confusion.
4. Recover from interruptions.
5. Sign in securely.
6. Reset their password easily.
7. Navigate the app confidently after onboarding.

If these outcomes are achieved, the authentication and onboarding experience is considered production-ready.
---
trigger: always_on
---

# Security Rules

The LAWMA app handles resident information, complaints, location data, and digital payments.

Residents trust LAWMA to:
- protect their personal information
- securely process payments
- safely store complaint reports
- protect location data
- prevent abuse of the platform

A security mistake here is not just a bug — it damages public trust.

Every agent working on this codebase must follow these rules without exception.

---

# Secrets and Configuration

Never commit secrets into the repository.

Sensitive values must live in environment variables.

Examples:
- database URLs
- API keys
- Flutterwave secrets
- session secrets
- notification keys
- storage credentials

---

## Required Environment Variables

```env
DATABASE_URL

FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_SECRET_HASH

SESSION_SECRET

NEXT_PUBLIC_APP_URL

STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
STORAGE_BUCKET

GOOGLE_MAPS_API_KEY

FCM_SERVER_KEY
```

---

## Environment Validation

Environment variables must be validated at application startup using zod.

If required variables are missing:
- the app must refuse to boot

Never allow partially configured environments.

---

## Public Variables

Only variables prefixed with:

```env
NEXT_PUBLIC_
```

may be exposed to the browser.

Never expose:
- secret keys
- webhook hashes
- database credentials
- private APIs

to the client.

---

# Authentication

LAWMA uses OTP-based authentication.

Passwords should not exist in the MVP authentication flow.

---

## OTP Security

OTP systems must:
- expire quickly
- be rate limited
- prevent brute-force attempts
- invalidate used codes immediately

Never log OTP values.

Never expose OTP verification logic to the client.

---

## Session Security

Sessions are cookie-based.

Cookies must use:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`

Session tokens must:
- be cryptographically random
- be unguessable
- use Node.js `crypto.randomBytes`

Never use:
```ts
Math.random()
```

for session or token generation.

---

## Session Invalidation

Logout must:
- invalidate the session server-side
- not simply remove the cookie

A stolen cookie should become useless once the session is revoked.

---

# Input Validation

Every external input must be validated with zod before:
- touching business logic
- touching the database
- triggering notifications
- triggering payments

This applies to:
- forms
- API routes
- webhook payloads
- query parameters
- route params
- file uploads
- notification payloads

Frontend validation is for UX.

Server validation is for security.

---

# SQL Injection

All database access must go through Prisma.

Never use:
```ts
$queryRawUnsafe
```

Never concatenate SQL strings manually.

If raw SQL is absolutely required:
- use parameterized queries only

---

# Cross-Site Scripting (XSS)

React escapes strings by default.

Main XSS risks:
- `dangerouslySetInnerHTML`
- user-submitted URLs
- uploaded files
- rendered HTML content

---

## HTML Injection

Do not use:
```ts
dangerouslySetInnerHTML
```

unless content is sanitized server-side.

Even sanitized HTML should only be used when absolutely necessary.

---

## URL Validation

Never place unvalidated URLs into:
- `href`
- `src`

Validate:
- protocol
- domain
- allowed origins

Only allow:
```txt
https://
```

URLs.

---

# Cross-Site Request Forgery (CSRF)

Server Actions include built-in CSRF protection.

Route handlers performing state-changing operations must:
- validate `Origin`
- validate `Referer`

against the app domain.

---

## Flutterwave Webhook Exception

Flutterwave webhooks are exempt from browser-origin checks.

Instead:
- verify the `verif-hash`
- verify the transaction with Flutterwave servers

---

# Payments (Flutterwave)

This section is critical.

Read it twice.

---

## Server-Side Verification Is Mandatory

Never trust the browser when it claims payment succeeded.

Correct flow:

1. Resident initiates payment
2. Server creates pending payment record
3. Server generates Flutterwave checkout link
4. Resident completes payment on Flutterwave
5. Flutterwave redirects browser back
6. Browser shows:
```txt
Verifying payment...
```
7. Flutterwave webhook arrives
8. Server verifies transaction with Flutterwave
9. Payment is marked successful
10. Receipt is generated

Only the webhook may mark payments successful.

---

## Webhook Security

Webhook handler:
```txt
src/app/api/webhooks/flutterwave/route.ts
```

must:
1. Verify `verif-hash`
2. Verify transaction via Flutterwave API
3. Match:
   - amount
   - currency
   - tx_ref
4. Update records inside a DB transaction
5. Handle duplicates safely

Reject invalid webhook signatures with:
```txt
401 Unauthorized
```

---

## Idempotency

Flutterwave can retry webhook delivery.

Duplicate webhook processing must be harmless.

Use database unique constraints to prevent:
- duplicate payments
- duplicate receipts
- duplicate notifications

Never rely only on application logic.

---

## Money Handling

Store money as integers.

Example:
```txt
₦1,000 = 100000 kobo
```

Never use:
- Float
- Decimal for amounts

Use:
- `Int`
- `BigInt`

---

# Resident Data Protection

The app handles sensitive resident data:
- phone numbers
- addresses
- GPS coordinates
- complaint photos
- payment history

This data must be protected.

---

## GPS and Location Data

GPS coordinates are sensitive.

Rules:
- only collect when necessary
- never expose publicly
- never log raw coordinates unnecessarily
- restrict access server-side

---

## Complaint Images

Complaint uploads may contain:
- homes
- vehicles
- private properties
- identifiable people

Treat uploads as sensitive.

---

# File Upload Security

Allowed formats:
- `image/jpeg`
- `image/png`
- `image/webp`

Validate actual file bytes.

Do not trust client MIME types.

---

## Upload Rules

- Maximum upload size enforced
- Strip metadata where possible
- Generate randomized filenames
- Never trust original filenames
- Never store uploads on local filesystem

Use object storage only.

---

# Rate Limiting

Apply rate limiting to:
- OTP requests
- login attempts
- complaint submissions
- payment initialization
- public APIs
- notification subscriptions

This helps prevent:
- spam
- abuse
- brute-force attacks
- payment attacks

---

# Logging

Logs should help debugging without leaking sensitive information.

---

## Safe To Log

- request method
- route path
- response status
- request duration
- request ID
- internal resident IDs

---

## Never Log

- OTP codes
- session tokens
- Flutterwave secret keys
- webhook hashes
- full payment payloads
- full addresses
- raw GPS coordinates
- uploaded file contents

---

# Notifications Security

Push notifications must:
- avoid sensitive data
- avoid exposing private complaint details
- avoid exposing payment references

Good:
```txt
Your complaint status has been updated.
```

Bad:
```txt
Your illegal dumping complaint at 14 Allen Avenue was resolved.
```

---

# Dependencies

Every dependency is a security risk.

Keep dependencies minimal.

Before adding packages:
- check maintenance status
- check download volume
- check recent updates

Avoid abandoned libraries.

Run:
```bash
npm audit
```

regularly.

---

# Access Control

Residents may only access:
- their own complaints
- their own payment history
- their own notifications
- their own profile

Never trust route structure alone for authorization.

Always verify ownership server-side.

---

# Error Responses

Never expose:
- stack traces
- Prisma errors
- SQL details
- internal file paths
- infrastructure details

Return sanitized messages only.

Good:
```txt
Something went wrong. Please try again later.
```

Bad:
```txt
PrismaClientKnownRequestError...
```

---

# Incident Response

If a secret leaks:
1. Rotate the secret immediately
2. Update production environment variables
3. Deploy updated configuration
4. Revoke old credentials
5. Inform the developer immediately

Never hide security incidents.

Fast response limits damage.

---

# What Not to Do

- Do not trust client-side payment success
- Do not expose secrets to the browser
- Do not bypass zod validation
- Do not store uploads locally
- Do not log sensitive resident information
- Do not use floats for money
- Do not skip webhook verification
- Do not expose raw server errors
- Do not use unapproved dependencies
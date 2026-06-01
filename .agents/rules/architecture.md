---
trigger: always_on
---

# Architecture Rules

These rules describe how the LAWMA app is put together. Every agent building features must follow this architecture. Do not introduce new patterns without discussing them with the developer first.

## The Stack

LAWMA is a Next.js application using the App Router, written in TypeScript, backed by PostgreSQL through Prisma. Payments run through Flutterwave. Styling is handled through CSS Modules and design tokens.

There is no separate backend service.

Everything lives inside the Next.js application using:
- Server Components
- Server Actions
- Route Handlers

The application is mobile-first and optimized for Lagos residents using low-end Android devices and unstable internet connections.

---

## Directory Layout

```txt
src/
├── app/
│   ├── (public)/                    public resident-facing routes
│   │   ├── onboarding/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── schedules/
│   │   ├── complaints/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── recycling/
│   │   └── profile/
│   │
│   ├── api/
│   │   ├── auth/                    authentication route handlers
│   │   ├── complaints/              complaint CRUD + tracking
│   │   ├── schedules/               collection schedules
│   │   ├── payments/                payment initialization + verification
│   │   ├── notifications/           push notification handlers
│   │   └── webhooks/
│   │       └── flutterwave/         Flutterwave webhook receiver
│   │
│   └── layout.tsx                   root layout
│
├── components/
│   ├── ui/                          primitive UI components
│   ├── complaints/                  complaint-related components
│   ├── schedules/                   schedule-related components
│   ├── payments/                    payment-related components
│   ├── notifications/               notification components
│   ├── profile/                     resident profile components
│   └── shared/                      shared reusable components
│
├── lib/
│   ├── db.ts                        Prisma client singleton
│   ├── auth.ts                      session/auth helpers
│   ├── flutterwave.ts               Flutterwave integration wrapper
│   ├── notifications.ts             notification helpers
│   ├── storage.ts                   upload/storage helpers
│   ├── validators/                  zod validation schemas
│   └── utils/                       utility helpers
│
├── prisma/
│   ├── schema.prisma                database schema source of truth
│   └── migrations/                  generated migration files
│
├── tokens/
│   └── tokens.css                   design tokens
│
├── styles/
│
└── public/
    └── static assets
```

---

## Rendering Rules

The LAWMA app is mobile-first.

Resident-facing screens should render fast and work reliably under unstable network conditions.

Server Components are the default.

Use Client Components only when the UI requires:
- local state
- browser APIs
- interactivity
- event listeners
- realtime client updates

Do not fetch from API routes inside Client Components when a Server Component can fetch the data directly and pass it down.

Avoid unnecessary client-side fetching.

---

## Data Flow

There are four kinds of writes in this app:

### 1. Resident-Initiated Writes

Actions like:
- onboarding
- complaint reporting
- profile updates
- reminder settings

go through Server Actions.

The flow:
1. User submits form
2. Server Action validates input with zod
3. Prisma writes to the database
4. Cache is revalidated where necessary

---

### 2. Public API Writes

Public-facing operations that need route handlers use:

```txt
src/app/api/
```

Examples:
- payment initialization
- image uploads
- OTP verification
- public notification subscriptions

---

### 3. Payment Confirmations

Flutterwave webhooks at:

```txt
src/app/api/webhooks/flutterwave/route.ts
```

are the ONLY trusted source of payment confirmation.

The browser redirect after payment is NOT trusted.

Only the webhook can:
- mark payment as successful
- generate receipts
- update billing records

---

### 4. System Notifications

Notifications are triggered by:
- collection reminders
- complaint status updates
- delayed pickups
- payment confirmations

Notification jobs should remain lightweight and fast.

Heavy background processing should not block user-facing requests.

---

## State Management

There is no global state library by default.

React state and server data should cover most cases.

Avoid:
- Redux
- MobX
- Jotai
- complex client-side stores

Use simple React patterns unless explicitly approved.

---

## Database Access

All database access goes through Prisma.

Raw SQL is only allowed inside migration files.

Every query involving user input must use Prisma's parameterized query builder.

Never use string interpolation in queries.

The Prisma client is imported ONLY from:

```txt
lib/db.ts
```

Do not instantiate:

```ts
new PrismaClient()
```

anywhere else.

Multiple Prisma clients can exhaust database connections in development.

---

## Authentication

Authentication is OTP-based using phone numbers.

Sessions are cookie-based.

Cookies must be:
- `httpOnly`
- `secure` in production
- `sameSite: lax`

The session helper in:

```txt
lib/auth.ts
```

exposes:

```ts
getSession()
```

for:
- Server Components
- Server Actions
- Route Handlers

Client Components should receive auth state from parent Server Components.

---

## Offline and Poor Network Handling

The LAWMA app must tolerate unstable internet connections.

Requirements:
- retry failed requests
- preserve unfinished forms locally
- cache important resident screens
- avoid blocking loaders where possible
- keep payload sizes small

Critical flows must survive weak connections:
- complaint reporting
- payment verification
- schedule viewing
- onboarding

---

## File Upload Architecture

Complaint image uploads:
- go through validated upload handlers
- are stored in configured object storage
- are never stored on the server filesystem

Uploaded files must:
- validate MIME type
- validate file size
- generate randomized filenames
- strip metadata where applicable

---

## Error Handling

Server Actions and Route Handlers return structured responses.

Success:
```ts
{ ok: true, data }
```

Failure:
```ts
{
  ok: false,
  error: {
    code,
    message
  }
}
```

The client must never receive:
- raw exception messages
- Prisma errors
- stack traces
- internal database details

Log the full error on the server.

Return sanitized errors to the user.

---

## Notifications Architecture

Notification delivery should support:
- push notifications
- in-app notifications
- future SMS fallback

Notification state should be decoupled from business logic.

The app should not fail if notifications fail.

---

## Environments

### Development
Runs locally using:
- local PostgreSQL
- Flutterwave test keys
- local environment variables

### Production
Runs using:
- production PostgreSQL
- Flutterwave live keys
- production object storage

No staging environment yet.

If one is added later:
- it should use Flutterwave test keys
- and a production-shaped database

---

## Scalability Expectations

The architecture should support:
- expansion across Lagos LGAs
- thousands of concurrent residents
- high complaint/report volume
- realtime operational updates
- future LAWMA admin dashboards
- future PSP operational systems

The app should remain modular enough for future expansion without requiring a rewrite.

---

## What Not to Do

- Do not add GraphQL.
- Do not add a separate Node/Express backend.
- Do not introduce microservices.
- Do not introduce unnecessary global state libraries.
- Do not store uploads on the filesystem.
- Do not bypass Prisma for database access.
- Do not trust client-side payment success.
- Do not introduce unapproved frameworks or architectural patterns.
- Do not build beyond the MVP scope without approval.
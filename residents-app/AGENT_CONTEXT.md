# LAWMA App — Agent Context Document

> Full codebase briefing for an AI agent coming into this project cold.
> Read this top-to-bottom before touching any file.

---

## 1. What This Project Is

**LAWMA** (Lagos Waste Management Agency) is a resident-facing web app for Lagos, Nigeria. It lets residents:

- View their waste collection schedule by LGA (Local Government Area)
- Pay waste management bills via Flutterwave
- File and track complaints about missed pickups, illegal dumping, etc.
- Receive in-app and email notifications
- Manage notification preferences (email + SMS toggles)
- Edit their profile
- Browse recycling tips

The app is a mobile-first PWA-style web app. The primary user is a Lagos resident on a smartphone.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| UI library | React 19 |
| Styling | CSS Modules + custom design token system |
| Icons | Lucide React (`lucide-react@^1.18.0`) |
| Database ORM | Prisma 7.8.0 with `@prisma/adapter-pg` |
| Database | PostgreSQL 16 (local: `postgresql://KingFizzy@localhost:5432/lawma`) |
| Payments | Flutterwave |
| Email | Nodemailer (SMTP via Gmail) |
| Validation | Zod 4 |
| Authentication | Custom session-cookie auth (no NextAuth) |
| Font | Inter (Google Fonts) |

---

## 3. Repository Layout

```
LAWMA APP/
├── prisma/
│   ├── schema.prisma           # DB models (NO url field — Prisma 7 style)
│   ├── prisma.config.ts        # Prisma config — loads .env via dotenv, sets datasource.url
│   ├── seed.ts                 # Database seed script
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 0000_init/
│       └── 0001_add-sms-notification-prefs/
├── tokens/
│   └── tokens.css              # SINGLE SOURCE OF TRUTH for all design tokens (colors, typography)
├── public/
│   ├── favicon.png
│   ├── logo-light.png
│   ├── logo-dark.png
│   ├── assets/landing/mockups/ # Landing page images (schedule.png, reports.png, etc.)
│   └── uploads/complaints/     # User-uploaded complaint photos (local dev only)
├── src/
│   ├── app/
│   │   ├── globals.css         # Global reset + imports tokens.css
│   │   ├── layout.tsx          # Root layout — sets Inter font, metadata
│   │   ├── page.tsx            # Landing page (public, no auth required)
│   │   ├── page.module.css
│   │   ├── api/                # All API route handlers
│   │   └── (public)/           # Route group — all pages (no shared layout logic)
│   │       ├── layout.tsx      # Passthrough — just renders children
│   │       ├── login/          # Auth page (sign in / sign up / OTP / reset password)
│   │       ├── onboarding/     # Complete Profile page (post-signup setup)
│   │       └── (app)/          # Authenticated app area
│   │           ├── layout.tsx  # Renders <Navbar /> + <main>
│   │           ├── dashboard/
│   │           ├── schedules/
│   │           ├── complaints/
│   │           │   ├── page.tsx        # Complaint list
│   │           │   ├── [id]/page.tsx   # Complaint detail
│   │           │   └── report/page.tsx # New complaint form
│   │           ├── payments/
│   │           ├── notifications/
│   │           │   ├── page.tsx
│   │           │   └── preferences/page.tsx
│   │           ├── recycling/
│   │           └── profile/
│   ├── components/
│   │   ├── ui/                 # Shared UI primitives
│   │   │   ├── Button.tsx / .module.css
│   │   │   ├── Input.tsx / .module.css
│   │   │   ├── Select.tsx / .module.css
│   │   │   ├── Navbar.tsx / .module.css
│   │   │   ├── Card.tsx / .module.css
│   │   │   ├── Badge.tsx / .module.css
│   │   │   ├── ThemeToggle.tsx / .module.css
│   │   │   ├── Toast.tsx / .module.css
│   │   │   ├── EmptyState.tsx / .module.css
│   │   │   ├── StatusBadge.tsx / .module.css
│   │   │   ├── StatusTimeline.tsx / .module.css
│   │   │   ├── OnboardingOverlay.tsx / .module.css
│   │   │   └── ProductTour.tsx / .module.css
│   │   └── profile/
│   │       ├── ProfileEditForm.tsx      # Inline edit/view form for profile fields
│   │       └── ProfileEditForm.module.css
│   ├── constants/
│   │   ├── index.ts            # LAGOS_LGAS, COMPLAINT_ISSUE_TYPES, status labels, OTP config, etc.
│   │   └── recycling.ts
│   ├── lib/
│   │   ├── auth.ts             # getSession / createSession / destroySession
│   │   ├── db.ts               # Prisma client singleton (PrismaPg adapter)
│   │   ├── logger.ts           # Simple structured logger
│   │   ├── sms.ts              # SMS sending (OTP)
│   │   ├── flutterwave.ts      # Payment gateway helpers
│   │   ├── validators/
│   │   │   └── validation.ts   # validateEmail, validatePhone, passwordRules, etc.
│   │   └── email/
│   │       ├── client.ts       # sendEmail() via Nodemailer
│   │       ├── layout.ts       # HTML email base template
│   │       ├── enqueue.ts      # Queues email to email_outbox table
│   │       └── templates/      # One file per email type
│   └── types/index.ts
```

---

## 4. Design System

### 4.1 Token File

**`tokens/tokens.css`** — at the project root (NOT inside `src/`). Imported by `src/app/globals.css`.

This is the **only place** to change colors, typography scale, or spacing values. Never hard-code raw values.

#### Color tokens (light mode)
```
--color-primary:              hsl(24, 98%, 50%)   /* orange */
--color-on-primary:           hsl(0, 0%, 100%)
--color-primary-container:    hsl(19, 100%, 79%)
--color-on-primary-container: hsl(22, 100%, 24%)
--color-secondary:            hsl(82, 81%, 23%)   /* dark green */
--color-background:           hsl(0, 0%, 99%)     /* near-white */
--color-surface:              hsl(0, 0%, 100%)    /* pure white */
--color-on-surface:           hsl(180, 2%, 11%)   /* near-black text */
--color-on-surface-variant:   hsl(0, 1%, 28%)     /* muted text */
--color-outline:              hsl(0, 0%, 47%)     /* placeholder text */
--color-outline-variant:      hsl(0, 0%, 88%)     /* borders */
--color-surface-container-low:     hsl(0, 0%, 97%)
--color-surface-container:         hsl(0, 0%, 95%)
--color-surface-container-high:    hsl(0, 0%, 92%)
--color-surface-container-highest: hsl(0, 0%, 90%)
--color-error:                hsl(0, 54%, 41%)
--color-on-error:             hsl(0, 0%, 100%)

/* Semantic status colors */
--color-status-success:       hsl(142, 60%, 38%)
--color-status-warning:       hsl(28, 80%, 46%)
--color-status-error:         hsl(0, 54%, 41%)
--color-status-info:          hsl(207, 70%, 50%)
(each has -container and on-*-container variants)
```

Dark mode tokens live under `[data-theme="dark"]` in the same file.

#### Typography scale (key sizes)
```
--headline-large-font-size:   38px
--headline-medium-font-size:  32px
--headline-small-font-size:   24px
--title-large-font-size:      28px
--title-medium-font-size:     20px
--title-small-font-size:      16px
--body-large-font-size:       16px    ← default body text
--body-medium-font-size:      14px
--body-small-font-size:       12px
--label-large-font-size:      14px    ← form labels
--label-medium-font-size:     12px
--label-small-font-size:      11px
```

Each has matching `*-line-height`, `*-letter-spacing`, `*-font-family` variables.

### 4.2 Dark Mode

Toggled by setting `html[data-theme="dark"]` on the `<html>` element. Stored in `localStorage` under the key `lawma-theme`. The `ThemeToggle` component and the `Navbar` both manage this.

```js
// Set dark mode
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('lawma-theme', 'dark');
```

### 4.3 Shared UI Components

All components are in `src/components/ui/`.

#### `<Button>`
```tsx
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  isLoading={boolean}
>
  Label
</Button>
```
- Always `width: 100%` (full-width)
- `lg` size is used for primary CTAs (forms, auth pages)
- Loading state shows a spinner and hides the label

#### `<Input>`
```tsx
<Input
  label="Field Label"
  placeholder="..."
  value={value}
  onChange={handler}
  error="Error message shown in red"
  helpText="Optional hint shown in gray"
  icon={<Mail size={16} strokeWidth={1.5} />}   // optional left icon
  type="password"   // adds eye-toggle button on right
/>
```
- Label color: `--color-on-surface-variant` (muted)
- Border: `1.5px solid --color-outline-variant`, radius `10px`
- Focus: border becomes `--color-primary`, box-shadow `0 0 0 3px hsla(24, 98%, 50%, 0.12)`
- Error border: `--color-error`
- Left icon: positioned absolutely at left, color `--color-outline`
- Password type: gets eye-toggle button on the right automatically

#### `<Select>`
```tsx
<Select
  label="Field Label"
  options={[{ value: 'val', label: 'Display' }]}
  placeholder="Select an option"
  value={value}
  onChange={handler}
  error="..."
/>
```
- Matches Input exactly: `1.5px` border, `10px` radius, same focus ring
- Custom chevron via `▾` span (not browser default)

#### `<Card>`
Generic surface container with padding, border, border-radius, and light shadow.

#### `<Badge>`
Status chip. `variant` maps to semantic color tokens.

#### `<Navbar>`
The main navigation. Renders differently on mobile vs desktop:

- **Desktop (≥768px):** Fixed left sidebar, collapsible (220px ↔ 64px), stores collapse state in `localStorage` under `lawma-sidebar`
  - Top: LAWMA logo (wordmark in light/dark variants, favicon when collapsed)
  - Middle: nav links (Home, Schedule, Report, Payments, Recycling)
  - Bottom account section: Profile link, Notifications (with unread badge), Theme toggle
  - Footer: Sign out button (triggers confirmation modal)
- **Mobile (<768px):**
  - Fixed hamburger button at `top: 12px; left: 12px` (opens bottom sheet)
  - Fixed bottom nav bar with 5 items: Home, Schedule, Report, Payments, Recycling
  - Sheet (slides up from bottom): Profile, Notifications, Theme toggle, Sign out

Layout offset for desktop sidebar: `--sidebar-w` CSS variable (`220px` expanded, `64px` collapsed) is applied as `margin-left` on the `<main>` element via `layout.module.css`.

---

## 5. Authentication System

Custom session-based auth. No third-party auth library.

### Flow

```
Sign-up / Sign-in
  → User enters phone number OR email
  → POST /api/auth/otp/send  (generates 6-digit OTP, sends via SMS or email)
  → User enters OTP
  → POST /api/auth/otp/verify
      → if new resident + signup mode → redirect to /onboarding (complete profile)
      → if existing resident → redirect to /dashboard

Forgot Password
  → User enters email or phone
  → POST /api/auth/check-resident (verifies account exists)
  → POST /api/auth/forgot-password (sends reset OTP)
  → User enters OTP + new password
  → POST /api/auth/reset-password

Sign out
  → POST /api/auth/logout
  → destroySession() → deletes DB session + clears cookie
```

### Session Management (`src/lib/auth.ts`)

```ts
// Cookie name
'lawma_session'

// Duration
7 days

// Functions
getSession()      // reads cookie, looks up in DB, returns { residentId, sessionId } or null
createSession()   // creates DB record, sets httpOnly cookie
destroySession()  // deletes DB record, removes cookie
```

Session token is a 64-char hex string (`crypto.randomBytes(32)`). Stored in the `sessions` table and in an httpOnly cookie.

### Route Protection

**Not middleware-based.** Each authenticated server component or API route calls `getSession()` directly and redirects/returns 401 if null.

```ts
// Pattern in every authenticated page
const session = await getSession();
if (!session) redirect('/login');
```

### Onboarding Gate

Dashboard redirects to `/onboarding` if `resident.name`, `resident.address`, or `resident.lga` are not set:

```ts
if (!(resident.name && resident.address && resident.lga)) redirect('/onboarding');
```

---

## 6. Database Schema

Prisma schema at `prisma/schema.prisma`. No `url` field in the datasource block (Prisma 7 style — URL comes from `prisma.config.ts`).

### Models

#### `Resident`
```
id                    UUID (PK)
phoneNumber           String (unique)
email                 String? (unique)
name                  String?
address               String?
lga                   String?
passwordHash          String?
onboardingVersion     Int (default 0)
onboardingCompletedAt DateTime?
createdAt / updatedAt DateTime
```

#### `Session`
```
id         UUID (PK)
residentId String → Resident
token      String (unique)
expiresAt  DateTime
createdAt  DateTime
```

#### `OtpCode`
```
id          UUID (PK)
phoneNumber String  (stores phone OR email — repurposed field name)
code        String
expiresAt   DateTime
isUsed      Boolean (default false)
createdAt   DateTime
```

#### `Complaint`
```
id          UUID (PK)
ticketId    String (unique) — format: LW-YYYYMMDD-LLLRRRR
residentId  → Resident
issueType   String (enum: MISSED_PICKUP | ILLEGAL_DUMPING | OVERFLOWING_BIN | PSP_MISCONDUCT | WASTE_BURNING | OTHER)
lga         String
area        String
address     String
description String?
status      ComplaintStatus (SUBMITTED | IN_REVIEW | ASSIGNED | RESOLVED)
latitude    Float?
longitude   Float?
createdAt / updatedAt DateTime
images      ComplaintImage[]
```

#### `ComplaintImage`
```
id          UUID (PK)
complaintId → Complaint
url         String  (path like /uploads/complaints/filename.jpg)
createdAt   DateTime
```

#### `Bill`
```
id           UUID (PK)
residentId   → Resident
amountKobo   Int
dueDate      DateTime
periodStart  DateTime
periodEnd    DateTime
status       BillStatus (PENDING | PAID | OVERDUE)
createdAt    DateTime
payments     Payment[]
```

#### `Payment`
```
id                       UUID (PK)
billId                   → Bill
residentId               → Resident
amountKobo               Int
currency                 String (default NGN)
status                   PaymentStatus (PENDING | SUCCESSFUL | FAILED | REVERSED)
txRef                    String (unique) — internal transaction reference
gatewayReference         String? (unique) — Flutterwave reference
flutterwaveTransactionId String?
verifiedAt               DateTime?
receiptNumber            String? (unique)
paidAt                   DateTime?
createdAt                DateTime
```

#### `PspOperator` (Private Sector Partner — the waste collection companies)
```
id           UUID (PK)
name         String
contactPhone String?
email        String?
zone         String
lga          String
schedules    CollectionSchedule[]
```

#### `CollectionSchedule`
```
id                UUID (PK)
lga               String
dayOfWeek         Int (0=Sunday … 6=Saturday)
windowStart       String (e.g. "08:00")
windowEnd         String (e.g. "12:00")
status            CollectionStatus (SCHEDULED | DELAYED | MISSED | COMPLETED)
delayReason       String?
nextCollectionDate DateTime?
pspOperatorId     → PspOperator
createdAt / updatedAt DateTime
```

#### `Notification`
```
id          UUID (PK)
residentId  → Resident
title       String
body        String
type        NotificationType (COLLECTION_REMINDER | DELAYED_PICKUP | COMPLAINT_UPDATE | PAYMENT_CONFIRMATION | ANNOUNCEMENT)
referenceId String?  (links to complaint/payment/schedule ID)
isRead      Boolean (default false)
createdAt   DateTime
```

#### `NotificationPreference`
```
id                       String (cuid, PK)
residentId               String (unique)
emailComplaintUpdates    Boolean (default true)
emailPaymentReceipts     Boolean (default true)
emailCollectionReminders Boolean (default true)
emailAnnouncements       Boolean (default false)
smsComplaintUpdates      Boolean (default true)
smsCollectionReminders   Boolean (default true)
smsDelayedPickup         Boolean (default true)
createdAt / updatedAt    DateTime
```

#### `EmailOutbox`
```
id        String (cuid, PK)
recipient String
subject   String
template  String
payload   Json
status    EmailStatus (PENDING | SENT | FAILED)
attempts  Int (default 0)
lastError String?
sentAt    DateTime?
createdAt / updatedAt DateTime
```

### Prisma Config (Important — Prisma 7 quirk)

The `datasource db` block in `schema.prisma` has NO `url` field. Instead, `prisma.config.ts` at the project root handles it:

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set in .env');

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: { url },
});
```

The Prisma client is instantiated in `src/lib/db.ts` using the `PrismaPg` adapter:

```ts
export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
```

The global singleton pattern prevents multiple Prisma instances during Next.js hot reload in development.

---

## 7. API Routes

All routes are in `src/app/api/`. Every route returns `{ ok: true, data: ... }` on success or `{ ok: false, error: { code: string, message: string } }` on failure.

### Auth Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/otp/send` | Send OTP to phone or email. Body: `{ phoneNumber? }` or `{ email? }`. 60s cooldown enforced. |
| POST | `/api/auth/otp/verify` | Verify OTP. Body: `{ phoneNumber?, email?, code }`. Creates session on success. Returns `{ isNewResident, residentId }`. |
| POST | `/api/auth/check-resident` | Check if account exists. Body: `{ phoneNumber? } or { email? }`. Returns `{ exists: boolean }`. |
| POST | `/api/auth/forgot-password` | Send password-reset OTP. |
| POST | `/api/auth/reset-password` | Reset password with OTP. Body: `{ phoneNumber?, email?, code, password }`. |
| POST | `/api/auth/logout` | Destroys session + cookie. |
| POST | `/api/auth/signin` | Email/password sign-in (alternative flow). |
| POST | `/api/auth/signup` | Email/password sign-up (alternative flow). |

### Profile & Notifications

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/profile/update` | Update name, address, lga. Requires session. Body: `{ name, address, lga }`. |
| GET | `/api/notifications/preferences` | Fetch notification prefs (upserts if not exist). |
| PUT | `/api/notifications/preferences` | Update prefs. Body: any subset of the 7 boolean fields. |
| GET | `/api/notifications/unread-count` | Returns `{ count: number }`. Used by Navbar badge. |

### Complaints

| Method | Path | Description |
|---|---|---|
| POST | `/api/complaints` | Create complaint. Body: `{ issueType, area, address, description?, latitude?, longitude?, imageUrls? }`. Generates ticketId like `LW-20250602-LAG1A3X`. Duplicate check: same issueType+area within 48h. |
| POST | `/api/upload` | Upload complaint photo. `multipart/form-data` with `file` field. Saves to `public/uploads/complaints/`. Returns `{ ok: true, url: '/uploads/complaints/filename' }`. Max 10MB, JPEG/PNG/WebP/HEIC only. |

### Payments

| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/initialize` | Initialize Flutterwave payment for a bill. |
| GET | `/api/payments/status` | Check payment status by txRef. |
| POST | `/api/webhooks/flutterwave` | Flutterwave webhook for payment confirmation. |

### Internal (cron/server-side)

| Method | Path | Description |
|---|---|---|
| POST | `/api/internal/email-dispatch` | Processes `email_outbox` queue. Protected by `INTERNAL_CRON_SECRET` header. |
| POST | `/api/internal/test-email` | Sends a test email. Development only. |

### Onboarding

| Method | Path | Description |
|---|---|---|
| POST | `/api/onboarding/complete` | Saves profile fields (name, lga, address) on first sign-up. |

---

## 8. Page-by-Page Summary

### Public Pages (no auth required)

#### Landing (`/`)
- `src/app/page.tsx` + `page.module.css`
- Server component
- Sections: Hero (phone mockup with schedule.png), Trust (truck.png + neighbourhood.png), Feature showcase (schedule/reports/payments mockups), Community (community.png), Confidence (operations.png)
- CTA buttons check localStorage for onboarding state and route to `/login` or `/dashboard`
- Uses `next/image` with `fill` for all images

#### Auth (`/login`)
- `src/app/(public)/login/page.tsx` + `page.module.css`
- Client component (wrapped in `<Suspense>` for `useSearchParams`)
- **Multi-step single-page flow** — `step` state switches between: `phone` → `otp` → `profile` (signup) or `reset` → reset-confirm
- **Two modes**: `signin` and `signup` (toggled by URL param `?mode=signup`)
- Card layout: white card on light gray background (`--color-surface-container-low`)
- Top: cardNav (Back button + ThemeToggle), logo circle (favicon in gray circle)
- All form fields use the shared `<Input>` / `<Select>` components with icons
- Icons: Mail on email, Phone on phone, Lock on passwords, Hash on OTP codes, User on name, MapPin on address

#### Onboarding (`/onboarding`)
- `src/app/(public)/onboarding/page.tsx` + `page.module.css`
- Client component
- Shown after first OTP verification for new signups
- Fields: Full Name, LGA (Select), Street Address
- Uses server action `completeOnboarding()` from `onboarding/actions.ts`
- Zod schema validates on server; field-level errors returned and displayed per-field
- Same card visual treatment as auth page

### Authenticated App Pages (`/(public)/(app)/`)

All pages in this group are protected — each checks `getSession()` and redirects to `/login` if null.

The shared layout (`layout.tsx`) renders `<Navbar />` and a `<main>` with `padding-bottom: 72px` (mobile, for bottom nav) or `margin-left: var(--sidebar-w)` (desktop, for sidebar).

#### Dashboard (`/dashboard`)
- Server component
- Fetches: resident profile, today's collection schedule (by `lga` + `dayOfWeek`), latest active complaint, 3 most recent notifications, random recycling tip
- Time-aware greeting: "Good morning/afternoon/evening, [first name]"
- Shows: pickup card, quick-action buttons (Report Issue, Pay Bill), active complaint card, notification list, recycling tip

#### Schedules (`/schedules`)
- Fetches collection schedules for the resident's LGA
- Shows schedule by day of week, with delay banner if status is DELAYED

#### Complaints (`/complaints`)
- List view: all resident's complaints, sorted by date
- Detail view (`/complaints/[id]`): ticket info, status timeline, complaint images

#### Report Complaint (`/complaints/report`)
- Client component
- Fields: Issue Type (Select), Area, Address, Description (textarea), Photos (up to 3)
- Photo upload: creates object URLs for preview, uploads each to `/api/upload` on submit, saves returned URLs with the complaint
- GPS coordinates captured via `navigator.geolocation.getCurrentPosition()` (optional, 5s timeout)
- Duplicate detection: server returns 409 if same issueType+area submitted within 48h

#### Payments (`/payments`)
- Shows bills and payment history
- Initiates Flutterwave checkout

#### Notifications (`/notifications`)
- Lists all notifications, marks as read on view

#### Notification Preferences (`/notifications/preferences`)
- Client component
- 4 email toggles + 3 SMS toggles
- Fetches current prefs on mount via `GET /api/notifications/preferences`
- Saves via `PUT /api/notifications/preferences`
- Toggle switch UI: custom CSS (`.toggleTrack` 44px × 26px, `.toggleThumb` slides 18px on active)

#### Profile (`/profile`)
- Shows avatar row (initial + name + phone), then `<ProfileEditForm>`
- Link to `/notifications/preferences`

#### Profile Edit Form (`src/components/profile/ProfileEditForm.tsx`)
- Client component
- Two modes: view (shows rows of label/value + "Edit profile" button) and edit (shows Input + Select + Input + Save/Cancel)
- PATCH `/api/profile/update` on save
- Success banner with 3s auto-dismiss

#### Recycling (`/recycling`)
- Static content — recycling tips and guidelines from `RECYCLING_TIPS` constant

---

## 9. Constants Reference

All in `src/constants/index.ts`:

```ts
LAGOS_LGAS           // string[] — all 20 Lagos LGAs
COMPLAINT_ISSUE_TYPES // { value, label, description }[]
COMPLAINT_STATUS_LABELS, PAYMENT_STATUS_LABELS, BILL_STATUS_LABELS, COLLECTION_STATUS_LABELS
DAYS_OF_WEEK, DAYS_OF_WEEK_SHORT
NOTIFICATION_TYPE_LABELS
RECYCLING_TIPS       // { category, title, description }[]
STATUS_COLORS        // maps status strings to CSS variable strings
OTP_EXPIRY_MINUTES = 5
OTP_LENGTH = 6
OTP_COOLDOWN_SECONDS = 60
```

---

## 10. Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://KingFizzy@localhost:5432/lawma"

FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_SECRET_HASH=

NEXT_PUBLIC_APP_URL="http://localhost:3000"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=lawmatest@gmail.com
SMTP_PASSWORD=<app-password>
SMTP_FROM_EMAIL=lawmatest@gmail.com
SMTP_FROM_NAME=LAWMA
EMAIL_ENABLED=true

INTERNAL_CRON_SECRET=<hex-string>
```

---

## 11. Coding Conventions

### File Naming
- Pages: `page.tsx` + `page.module.css` (co-located)
- Shared components: `ComponentName.tsx` + `ComponentName.module.css`
- API routes: `route.ts`

### Component Patterns
- **Server components** for data-fetching pages (dashboard, schedules, complaints list/detail, profile page)
- **Client components** (`'use client'`) for interactive pages (auth, onboarding, report form, notification prefs, profile edit form)
- Server actions used in onboarding (`completeOnboarding` in `onboarding/actions.ts`)
- No global state management (no Redux/Zustand) — all state is local `useState` or server-fetched

### Styling Rules
- **CSS Modules only** — no Tailwind, no inline styles, no global class names
- **All color/size values must reference design tokens** — never hard-code `#fff` or `16px` directly
- Tokens accessed as `var(--token-name)` in CSS
- Dark mode: `html[data-theme="dark"] .className` pattern in CSS modules (using `:global()` where needed)
- Responsive breakpoint: `768px` (mobile below, desktop above)

### API Response Shape
```ts
// Success
{ ok: true, data: { ... } }

// Failure
{ ok: false, error: { code: string, message: string } }
```

### Icons
Lucide React everywhere. Consistent sizing: `size={16}` for inline/form icons, `size={20}` for nav/action icons, `size={22}` for bottom nav, `size={18}` for secondary actions. `strokeWidth={1.5}` throughout.

### Form Pattern
```tsx
// Standard client-side form pattern
const [value, setValue] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError('');
  // client-side validation...
  setLoading(true);
  try {
    const res = await fetch('/api/...', { method: 'POST', ... });
    const data = await res.json();
    if (!data.ok) { setError(data.error.message); return; }
    // success path
  } catch {
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
}
```

---

## 12. Known Constraints & Gotchas

1. **Prisma 7 datasource URL**: Never add `url = env("DATABASE_URL")` to `schema.prisma`. That field was removed in Prisma 7. The URL lives exclusively in `prisma.config.ts`.

2. **`env()` from `prisma/config` doesn't auto-load `.env`**: The config file uses `dotenv.config()` explicitly with an absolute path. If you see "datasource.url property is required", check `prisma.config.ts`.

3. **Migration workflow**: After schema changes, run:
   ```bash
   npx prisma migrate dev --name description-of-change
   npx prisma generate
   ```
   If `migrate dev` fails non-interactively (Claude Code context), use `prisma migrate diff --from-config-datasource --to-schema ./prisma/schema.prisma --script -o ./prisma/migrations/XXXX_name/migration.sql` then `prisma migrate deploy`.

4. **File uploads are local only**: `public/uploads/complaints/` is a local filesystem path. In production, this must be replaced with cloud storage (S3/Cloudinary). Currently: `POST /api/upload` saves files directly to this directory.

5. **No middleware auth**: Route protection is done per-page with `getSession()`, not via `middleware.ts`. Every authenticated page must include its own session check.

6. **`--color-sidebar-w` CSS variable**: Set on `<html>` and mutated by the Navbar collapse toggle. Controls `margin-left` on `<main>` for the sidebar layout on desktop.

7. **OtpCode.phoneNumber field stores email too**: The `phone_number` column in `otp_codes` stores whichever identifier was used (phone OR email). This is a deliberate reuse, not a bug.

8. **`next/image` required for landing page images**: All images in `page.tsx` use `<Image fill .../>` from `next/image`. The `src/app/page.tsx` wrapper divs must have `position: relative` and explicit `height` for `fill` to work.

9. **`serverBodySizeLimit` is NOT in `next.config.ts`**: This experimental option was removed in Next.js 15. The upload route uses `export const maxDuration = 30` for timeout only. Default 4MB body limit applies per-request (uploads are sent one file at a time).

10. **ThemeToggle is `position: fixed` by default**: When placing it inside a card or flex container, override with `position: static !important` via a local class (see `login/page.module.css → .toggleInCard`).

---

## 13. Development Setup

```bash
# Install dependencies
npm install

# Start local PostgreSQL (if using Homebrew)
brew services start postgresql@16

# Create database (first time)
createdb lawma

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npm run seed

# Start dev server
npm run dev
# → http://localhost:3000
```

The app also exposes on the local network at the machine's IP (configured in `next.config.ts` via `allowedDevOrigins`).

---

## 14. What Has Been Built (Session History Summary)

This project was built iteratively. The key features completed:

- Full OTP-based auth (phone + email, sign-in + sign-up + password reset)
- Dashboard with live schedule, complaints, notifications, recycling tip
- Collection schedule page filtered by resident's LGA
- Complaint reporting with photo upload (up to 3 photos), GPS coordinates, duplicate detection
- Complaint list and detail with status timeline
- Bill and payment flow via Flutterwave
- Notification list and real preferences page (7 toggles: 4 email + 3 SMS)
- Profile editing inline (view/edit mode toggle)
- Navbar: desktop sidebar (collapsible) + mobile bottom nav + hamburger sheet
- Theme toggle (light/dark) persisted in localStorage
- Full design system with Material Design 3–inspired token system
- Email delivery via Nodemailer with HTML templates
- Email outbox queue in DB for reliable dispatch
- Form system aligned to design reference: card layout for auth/onboarding, icon-prefixed inputs, muted labels, consistent borders/radius/focus rings across Input, Select, and textarea

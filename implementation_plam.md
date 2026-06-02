# LAWMA App — 10/10 Implementation Plan

## Current State Assessment

The scaffolded application already provides a strong foundation:

### Existing Strengths

* OTP Authentication + Session Management
* Prisma + PostgreSQL setup
* Flutterwave payment integration
* Design token architecture
* UI primitives
* App Router structure
* Mobile-first foundation
* Complaint model foundation
* Collection schedule foundation

### Current Gaps

* Dashboard is navigation-focused instead of action-focused
* Complaint reporting lacks guided workflow
* Complaint tracking lacks ticket system and timeline
* Schedule experience lacks operational status
* Notifications system incomplete
* Payment verification UX incomplete
* Recycling content lacks structure
* No duplicate complaint prevention
* No resident notification preferences
* No future analytics readiness
* Missing QA/testing strategy
* Missing demo/seed data strategy

---

# Phase 1 — Foundation Hardening

## 1.1 Database Schema Expansion

### File

```txt
prisma/schema.prisma
```

### Complaint Enhancements

Add:

```prisma
ticketId String @unique
```

Format:

```txt
LAWMA-IKJ-2026-000421
```

Benefits:

* Resident trust
* Easier support
* Government-standard tracking

---

### Collection Schedule Enhancements

Create:

```prisma
enum CollectionStatus {
  SCHEDULED
  DELAYED
  MISSED
  COMPLETED
}
```

Add:

```prisma
status CollectionStatus
delayReason String?
nextCollectionDate DateTime
```

---

### Payment Enhancements

Add:

```prisma
enum PaymentStatus {
  PENDING
  SUCCESSFUL
  FAILED
  REVERSED
}
```

Add:

```prisma
flutterwaveTransactionId String?
verifiedAt DateTime?
receiptNumber String?
```

---

### Notification Enhancements

Create:

```prisma
enum NotificationType {
  COLLECTION_REMINDER
  DELAYED_PICKUP
  COMPLAINT_UPDATE
  PAYMENT_CONFIRMATION
  ANNOUNCEMENT
}
```

Add:

```prisma
referenceId String?
```

---

### Analytics Readiness

Add indexes:

```prisma
@@index([lga])
@@index([assignedPsp])
@@index([status])
@@index([createdAt])
```

Future dashboards depend on these.

---

## 1.2 Design System Alignment

### File

```txt
tokens/colors.css
```

Current rules require asking before creating tokens.

Proposed additions:

```css
--color-status-success
--color-status-warning
--color-status-error
--color-status-info
```

Used by:

* complaints
* schedules
* payments
* notifications

---

## 1.3 Seed Data

Create:

```txt
prisma/seed.ts
```

Seed:

### PSPs

* LAWMA PSP Ikeja
* LAWMA PSP Lekki
* LAWMA PSP Surulere

### Schedules

Generate sample pickup schedules.

### Complaints

Generate:

* Submitted
* In Review
* Assigned
* Resolved

Examples.

### Notifications

Generate realistic notifications.

### Bills

Generate pending and paid bills.

Purpose:

Allows rapid UI iteration without waiting for real data.

---

# Phase 2 — Payment Infrastructure Hardening

Highest-risk feature.

Must be stabilized before major UI work.

---

## Flutterwave Flow

### Resident

1. Select bill
2. Tap Pay Bill

---

### Backend

```txt
POST /api/payments/initialize
```

Creates:

```txt
PENDING
```

payment record.

Generates:

```txt
checkoutUrl
```

Returns URL.

---

### Flutterwave

Resident pays.

Redirects:

```txt
/payments/verify
```

---

### Verify Screen

Display:

```txt
Verifying payment...
```

Poll:

```txt
/api/payments/status
```

---

### Webhook

```txt
/api/webhooks/flutterwave
```

Must:

* verify verif-hash
* verify transaction with Flutterwave
* verify amount
* verify currency
* verify tx_ref
* update DB transactionally

Only webhook can mark:

```txt
SUCCESSFUL
```

---

## Idempotency Protection

Use:

```prisma
@unique
```

constraints on:

```txt
transactionReference
receiptNumber
```

Duplicate webhooks must be harmless.

---

# Phase 3 — Complaint Tracking Foundation

## New Detail Page

Create:

```txt
/complaints/[id]
```

---

### Complaint Details

Show:

* Ticket ID
* Category
* Submitted Date
* Location
* Photos
* Description
* Current Status

---

### Status Timeline

Component:

```txt
StatusTimeline.tsx
```

Steps:

1. Submitted
2. In Review
3. Assigned
4. Resolved

---

### Future-Ready

Timeline structure should support:

```txt
Rejected
Escalated
Reopened
```

later.

---

# Phase 4 — Multi-Step Complaint Wizard

Replace current report flow.

---

## Step 1

Issue Category

Examples:

* Missed Pickup
* Illegal Dumping
* Overflowing Bin
* PSP Misconduct
* Waste Burning

---

## Step 2

Location

Attempt GPS.

Fallback:

Manual address.

---

## Step 3

Photo Upload

Allow:

* Camera
* Gallery

Preview required.

---

## Step 4

Description

Optional.

Max:

```txt
500 chars
```

---

## Step 5

Review

Resident confirms.

---

## Step 6

Submit

Generate:

```txt
Ticket ID
```

Show success state.

---

## Duplicate Detection

Create:

```txt
POST /api/complaints/check-duplicate
```

Avoid:

```txt
?check=true
```

---

Logic:

Compare:

* area
* issueType
* status
* radius

If duplicate:

Show:

```txt
A similar report already exists in your area.
```

Future:

```txt
Follow Existing Report
```

---

# Phase 5 — Notification System

Create complete notification infrastructure.

---

## Notification Center

Route:

```txt
/notifications
```

---

Types:

* Collection Reminder
* Delayed Pickup
* Complaint Update
* Payment Confirmation
* LAWMA Announcement

---

## Read State

Support:

```txt
mark-as-read
mark-all-read
```

---

## Future Channels

Architecture should support:

* Push
* SMS
* Email

without redesign.

---

# Phase 6 — Dashboard Rebuild

Dashboard becomes task-first.

---

## Section 1

Greeting

---

## Section 2

Next Pickup Card

Shows:

* PSP
* Collection Date
* Time Window
* Status

---

## Section 3

Quick Actions

Buttons:

* Report Issue
* Pay Bill

---

## Section 4

Active Complaint

Latest unresolved complaint.

---

## Section 5

Recent Notifications

Latest 3.

---

## Section 6

Recycling Tip

Single rotating card.

---

Goal:

Resident sees everything important in under 5 seconds.

---

# Phase 7 — Schedule Experience

Rewrite schedule page.

---

Display:

* Assigned PSP
* Next Collection Date
* Time Window
* Status

---

Statuses:

* Scheduled
* Delayed
* Missed
* Completed

---

Delay Banner

Visible when delayed.

---

Reminder Preferences

Store:

```txt
Database
```

not localStorage.

LocalStorage may be used as temporary cache only.

---

# Phase 8 — Recycling Education

Structure content for future search.

---

Categories:

* Home
* Markets
* Businesses
* Illegal Dumping

---

Create:

```txt
src/constants/recycling.ts
```

---

Data Model

```ts
{
  category,
  title,
  description,
  icon
}
```

Future-ready for:

```txt
"What do I do with this waste?"
```

search.

---

# Phase 9 — Navigation Improvements

Navbar:

1. Home
2. Schedule
3. Report
4. Payments
5. Profile

Notification badge appears globally.

---

# Phase 10 — Resident Profile

Enhancements:

* Assigned PSP
* Address
* LGA
* Notification Preferences
* Complaint Count
* Payment History Summary

---

# Phase 11 — Complaint List Enhancement

Show:

* Ticket ID
* Category
* Status
* Created Date

Click opens:

```txt
/complaints/[id]
```

---

# Phase 12 — QA & Testing

Required before launch.

---

## Mobile Testing

Test:

```txt
375px
390px
414px
768px
```

---

## Payment Testing

Test:

* successful payment
* failed payment
* duplicate webhook
* webhook retry
* timeout

---

## Complaint Testing

Test:

* GPS denied
* image upload failure
* offline mode
* duplicate complaint

---

## Accessibility

Verify:

* keyboard navigation
* labels
* contrast
* focus states

---

## Performance

Measure:

* bundle size
* image upload size
* first load
* dashboard render

---

# Final Build Order

1. Schema Expansion
2. Design Tokens
3. Seed Data
4. Payment Infrastructure Hardening
5. Complaint Detail + Timeline
6. Complaint Wizard
7. Notification System
8. Dashboard Rebuild
9. Schedule Rewrite
10. Recycling Education
11. Navbar Improvements
12. Profile Enhancements
13. Complaint List Improvements
14. QA & Testing
15. Production Readiness Review

---

# Success Criteria

A resident should be able to:

1. Sign in with OTP
2. See next pickup instantly
3. Report an issue in under 60 seconds
4. Receive a ticket number
5. Track progress
6. Pay a bill securely
7. Receive payment confirmation
8. Receive pickup reminders
9. Access recycling guidance
10. Use the entire app comfortably on a low-end Android device and unstable network

If these outcomes are achieved, the MVP is successful.

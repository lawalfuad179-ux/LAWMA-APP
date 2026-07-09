# Integration assumptions

What we depend on from each external service, what shape we expect the data in, and what would break us if it changed. Pull this out of the drawer when an integration starts behaving weirdly — most regressions live in the gap between what we *assume* and what the provider actually does (Hyrum's Law).

---

## Reward economics

- **Earn:** every successful bill payment grants `POINTS_PER_BILL_PAYMENT` (currently 5) points. Awarded inside the same DB transaction that marks the bill `PAID`. Source-of-truth helper: `awardBillPaymentPoints()` in `src/lib/rewards.ts`. Idempotent — safe to call from both the Flutterwave webhook and the `/api/payments/status` poll-fallback.
- **Conversion:** 1 point = ₦1 (100 kobo). The UI surfaces this 1:1 so a resident never has to do math.
- **Auto-redeem:** at payment-initiate time the system applies the resident's available point balance against the bill, capped at **50%** of the bill's undiscounted amount (`MAX_REDEEM_FRACTION`). The redemption is recorded as a `REDEEMED_BILL_DISCOUNT` `PointTransaction`; `Bill.discountKobo` is updated; `RewardAccount.balance` is decremented. Helper: `applyRedemption()`.
- **Minimum redemption:** `MIN_REDEEM_POINTS = 1`. Set deliberately low so every earned point is useful — there is no "save up for 100" friction.
- **What Flutterwave sees:** the **net** charge (bill amount minus all applied discount). `Payment.amountKobo` is also the net amount, so webhook signature checks match exactly. The bill's gross `amountKobo` is preserved untouched on the Bill row for receipts/audit.
- **Failed/abandoned payments:** the discount stays applied to the bill. A retry sees `discountKobo > 0` and only auto-applies new credit up to the remaining headroom. Points are not "stuck in limbo" — they're either spent on a bill (whether that bill is eventually paid or not) or sitting in `RewardAccount.balance`.
- **Bulk pay (`/api/payments/initialize-all`):** spreads redemption across outstanding bills in due-date order, each capped at its own 50% headroom.

## Flutterwave (payments — current primary)

**What we use it for**
- Hosted checkout: create a payment link → user pays → we receive a webhook → we verify → mark bill PAID + award reward points.

**Webhook contract we depend on**
- Endpoint: `POST /api/webhooks/flutterwave`.
- Header `verif-hash` equals `FLUTTERWAVE_SECRET_HASH` set in our env.
- Body shape: `{ event: 'charge.completed', data: { id: number, tx_ref: string, flw_ref: string, amount: number, currency: 'NGN', status: string } }`.
- We DO NOT trust the webhook body for anything besides matching `tx_ref` to our `Payment` row. The authoritative state comes from `GET /v3/transactions/{id}/verify`.

**Verify endpoint contract we depend on**
- `verifyData.status === 'success'`
- `verifyData.data.status === 'successful'`
- `verifyData.data.amount === payment.amountKobo / 100` (kobo → naira conversion at the gateway boundary)
- `verifyData.data.currency === 'NGN'`
- `verifyData.data.tx_ref === payment.txRef`

**What would break us**
- Flutterwave changing the webhook event name or removing `data.tx_ref`. We have guards that return 200 on malformed bodies so they don't retry-storm us, but successful payments would silently fail to be marked PAID.
- Flutterwave deprecating the v3 verify endpoint. We have no fallback.
- A `customer_email` format Flutterwave doesn't accept (e.g. `+234@lawma.resident`). Mitigated by `sanitizeEmail()` in `src/lib/flutterwave.ts`.

**Live-key cutover checklist**
1. Update `FLUTTERWAVE_*` env vars in Vercel.
2. Reconfigure webhook URL in Flutterwave live dashboard to `https://lawma-app.vercel.app/api/webhooks/flutterwave`.
3. Set the same `FLUTTERWAVE_SECRET_HASH` in BOTH the live dashboard webhook config AND Vercel env.
4. Do one ₦100 live card test before opening up.

---

## LawmaPay / Paycube (payments — planned primary on contract)

**Status: NOT INTEGRATED.** We have not seen API docs yet. Assumptions listed here will be verified during the integration phase.

**What we will need from LAWMA's procurement / IT team**
- API endpoint base URL (sandbox + production)
- Authentication scheme (API key, OAuth, or signed requests)
- Bill reference format — does LawmaPay use our `Bill.id` as the reference, or do we adopt theirs?
- Webhook spec (or do we poll their reconciliation endpoint?)
- Settlement timing (real-time, T+1, T+N?)
- Reversal / chargeback semantics

**Architecture plan**
- Add a `payment_provider` column to `Payment` (`'flutterwave' | 'lawmapay'`).
- Make `createPaymentLink()` / verification provider-pluggable.
- Keep Flutterwave as fallback to preserve uptime if LawmaPay has an outage.

---

## Neon Postgres (database)

**What we use it for**
- Primary data store. Connected via Prisma + `@prisma/adapter-pg`.

**What we expect**
- Pooled connection URL works for serverless functions (default for our Vercel deployment).
- `sslmode=require` is honoured (we *want* `verify-full` for hygiene; Neon's integration provides `require` only, which is acceptable).
- Auto-suspend cold-starts are < 5 seconds and won't blow our Vercel function timeout.
- Migrations run idempotently — `IF NOT EXISTS` guards are present where it matters.

**What would break us**
- The Vercel-Neon integration overwriting our manually-set `DATABASE_URL`. (We've already seen this once. Today, integration owns the var.)
- A required column missing in prod (the original P2022 incident). Caught now by `/api/internal/health` schema spot-check.
- Connection-pool exhaustion at scale. Not a current risk; budget for it past ~10k concurrent users.

---

## Vercel Blob (file storage)

**What we use it for**
- Resident profile photos (`/api/upload`).
- Recycling scan images (`/api/recycle/scan`).

**What we expect**
- `@vercel/blob.put()` auto-detects credentials on Vercel runtime even without explicit `BLOB_READ_WRITE_TOKEN`.
- Public-access URLs are CDN-cached and stable.

**What would break us**
- Conditional code that gates on `process.env.BLOB_READ_WRITE_TOKEN` will fall to a local-fs path and fail with EROFS on Vercel's read-only filesystem. *We hit this in production and fixed it.* Pattern to avoid: don't ever guard on that env var; always call `put()`.

---

## Anthropic (Claude) — recycling AI

**What we use it for**
- `analyzeWasteImage()` in `src/lib/ai.ts`. Vision model classifies image into recyclable / non-recyclable items, returns structured JSON.

**What we expect**
- `ANTHROPIC_API_KEY` set, model defaults to `claude-haiku-4-5-20251001`.
- Image must be `image/jpeg | image/png | image/webp | image/gif` — HEIC from iPhones is converted in-process with `heic-convert`.
- Model returns JSON parseable from a `{...}` substring of the response.

**What would break us**
- Anthropic rejecting our model id (deprecated). Set `CLAUDE_VISION_MODEL` env var to override.
- Model hallucinating recyclable items in an empty image. Mitigated by an `imageValid: false` hard rule in the system prompt + abuse guards on the scan endpoint.
- Per-request cost spike. Not a near-term concern; recycling no longer earns rewards so volume stays low.

---

## Brevo SMS + SMTP (notifications)

**What we use it for**
- OTP delivery (SMS for phone-based accounts, SMTP for email-based).
- Bill reminders, complaint updates, recycling scan confirmations.

**What we expect**
- Brevo SMS API responds < 2s in normal operation.
- SMTP TLS handshake completes (we hit `wrong version number` errors when `SMTP_SECURE` and `SMTP_PORT` are mismatched).

**What would break us**
- SMS quota exhaustion. At scale, ₦2/SMS × millions of bills/month is non-trivial; plan to renegotiate or move to email-first.
- Provider gateway changes that need IP / sender-ID re-whitelisting.

**Live-deploy gotcha**
- Port `587` requires `SMTP_SECURE=false` (STARTTLS).
- Port `465` requires `SMTP_SECURE=true` (implicit TLS).

---

## Sentry (error monitoring)

**What we use it for**
- Capturing unhandled exceptions in production for incident response.

**What we expect**
- Server-side: `SENTRY_DSN` env var picked up by `instrumentation.ts`.
- Client-side: `NEXT_PUBLIC_SENTRY_DSN` (can be the same DSN; the public prefix is what makes it available to the browser bundle).
- Sentry SDK only initialises in `NODE_ENV === 'production'` — local dev stays quiet.

**Setup**
1. Create a Sentry project (Next.js platform).
2. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars.
3. Redeploy; verify by checking the Sentry dashboard for the next 500.

---

## Cron schedule (currently disabled on Hobby plan)

- `/api/internal/pickup-reminders` runs daily at 06:00 via `vercel.json`.
- `/api/internal/email-dispatch` should run every 5 minutes; **NOT** in `vercel.json` because Hobby plan caps cron to daily. Wire an external trigger ([cron-job.org](https://cron-job.org)) hitting that endpoint with `Authorization: Bearer $INTERNAL_CRON_SECRET`.

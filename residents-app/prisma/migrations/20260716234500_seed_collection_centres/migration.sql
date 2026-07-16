-- Reference + demo data for the collection-centre buy-back module.
--
-- This lives in a migration rather than a seed script because Vercel injects
-- DATABASE_URL only at build time, where `prisma migrate deploy` already runs.
-- Centres and material rates are genuine reference data; the operators and demo
-- resident are pitch-demo fixtures, revoked afterwards with
-- `npx tsx prisma/revoke-center-demo.ts`.
--
-- Only bcrypt hashes appear here — no plaintext credential is committed.
--
-- Everything is keyed off NATURAL keys (centre name, staff code, phone number)
-- rather than fixed ids, so this is a no-op against a database that already has
-- the rows under different ids (e.g. a dev box seeded by prisma/seed-centers.ts)
-- and safe to re-run anywhere.

-- ── Centres ───────────────────────────────────────────────────────────────
-- Named after facilities LAWMA already operates (per the MD: "we're starting
-- with our existing facilities like Simpson, Ocean").
INSERT INTO "collection_centers" ("id", "name", "address", "lga", "is_active", "created_at")
SELECT gen_random_uuid(), v.name, v.address, v.lga, true, CURRENT_TIMESTAMP
FROM (VALUES
  ('Simpson', 'Simpson Transfer Station, Lagos Island', 'Lagos Island'),
  ('Ocean',   'Ocean Transfer Station, Victoria Island', 'Eti-Osa')
) AS v(name, address, lga)
WHERE NOT EXISTS (
  SELECT 1 FROM "collection_centers" c WHERE c."name" = v.name
);

-- ── Buy-back rates ────────────────────────────────────────────────────────
-- INDICATIVE ONLY — LAWMA sets real pricing. Stored as kobo per kg. Kept in the
-- database rather than code so they can be repriced without a redeploy; the
-- kiosk labels them as indicative at the point they are read.
INSERT INTO "material_rates" ("id", "material", "kobo_per_kg", "is_active", "updated_at")
SELECT gen_random_uuid(), v.material::"DropOffMaterial", v.rate, true, CURRENT_TIMESTAMP
FROM (VALUES
  ('METAL',     50000),
  ('PLASTIC',   20000),
  ('CARDBOARD', 10000),
  ('PAPER',      8000),
  ('GLASS',      5000)
) AS v(material, rate)
ON CONFLICT ("material") DO NOTHING;

-- ── Kiosk operators ───────────────────────────────────────────────────────
-- Shared demo passcode, bcrypt cost 10. A real deployment issues per-staff
-- credentials through LAWMA's own staff onboarding, not a migration.
INSERT INTO "center_operators" ("id", "name", "staff_code", "passcode_hash", "center_id", "is_active", "created_at")
SELECT
  gen_random_uuid(),
  v.name,
  v.staff_code,
  '$2b$10$6Tx25Oy3JzYSp8dB75KkYusd9kefjvwKe4Q3czmGcIpR9mklOUBo2',
  c."id",
  true,
  CURRENT_TIMESTAMP
FROM (VALUES
  ('Adebayo O.',  'SIM01', 'Simpson'),
  ('Chidinma E.', 'OCE01', 'Ocean')
) AS v(name, staff_code, centre)
JOIN "collection_centers" c ON c."name" = v.centre
ON CONFLICT ("staff_code") DO NOTHING;

-- ── Demo resident ─────────────────────────────────────────────────────────
-- Phone is the account identifier, in the +234 form that signup/signin
-- normalize to.
INSERT INTO "residents" (
  "id", "phone_number", "name", "address", "lga",
  "password_hash", "onboarding_version", "onboarding_completed_at",
  "created_at", "updated_at"
)
VALUES (
  gen_random_uuid(),
  '+2348000000001',
  'Demo Resident',
  '12 Broad Street, Lagos Island',
  'Lagos Island',
  '$2b$10$2V2XBZLzf3EXQx/YAYM1Hu07yrbsdF6TEOVcSS3082O1Iak2uRk5G',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("phone_number") DO NOTHING;

-- Make sure the demo resident can be signed into even if the row already
-- existed without a password (e.g. created by an earlier walk-up).
UPDATE "residents"
SET "password_hash" = '$2b$10$2V2XBZLzf3EXQx/YAYM1Hu07yrbsdF6TEOVcSS3082O1Iak2uRk5G',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "phone_number" = '+2348000000001'
  AND "password_hash" IS NULL;

-- One outstanding bill, so counter credit visibly reduces what is owed:
-- 6kg of plastic at the indicative rate takes 1,200 naira off this 5,000 bill.
-- Resolved through the resident's phone so it binds to whatever id that row has.
INSERT INTO "bills" (
  "id", "resident_id", "amount_kobo", "discount_kobo",
  "due_date", "period_start", "period_end", "status", "created_at"
)
SELECT
  gen_random_uuid(),
  r."id",
  500000,
  0,
  date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month 4 days',
  date_trunc('month', CURRENT_TIMESTAMP),
  date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month' - INTERVAL '1 day',
  'PENDING',
  CURRENT_TIMESTAMP
FROM "residents" r
WHERE r."phone_number" = '+2348000000001'
  AND NOT EXISTS (
    SELECT 1 FROM "bills" b
    WHERE b."resident_id" = r."id" AND b."status" IN ('PENDING', 'OVERDUE')
  );

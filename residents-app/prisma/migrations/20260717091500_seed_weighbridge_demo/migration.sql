-- Seed the weighbridge demo (Module B). Shipped as a migration because Vercel
-- env vars are unreadable from the CLI — same approach as
-- 20260716234500_seed_collection_centres. Natural keys throughout (station
-- name, staff code, rfid tag); every statement is a no-op when the row already
-- exists, so re-running `migrate deploy` is safe. Contains only a bcrypt hash,
-- never a plaintext passcode.

-- The transfer station (Ebute-Ero — where this model already runs physically).
INSERT INTO "collection_centers" ("id", "name", "address", "lga", "kind", "is_active")
SELECT gen_random_uuid(), 'Ebute-Ero Transfer Station', 'Ebute-Ero Market, Lagos Island', 'Lagos Island', 'TRANSFER_STATION', true
WHERE NOT EXISTS (
  SELECT 1 FROM "collection_centers" WHERE "name" = 'Ebute-Ero Transfer Station'
);

-- Station attendant. Reuses the centre-operator auth wholesale.
INSERT INTO "center_operators" ("id", "name", "staff_code", "passcode_hash", "center_id", "is_active")
SELECT gen_random_uuid(), 'Ebute-Ero Attendant', 'EBT01',
       '$2b$10$ykSPACLaDygJxrqbtvCHsOHVoNiFQaQf6N4DOegaPTSgiDWi6/Rke',
       c."id", true
FROM "collection_centers" c
WHERE c."name" = 'Ebute-Ero Transfer Station'
  AND NOT EXISTS (SELECT 1 FROM "center_operators" WHERE "staff_code" = 'EBT01');

-- Tipping fee: INDICATIVE ONLY, not LAWMA pricing (the UI says so). ₦150/kg —
-- a ~5kg building load docks ~₦750, in the ballpark of the ~₦800/building
-- Ebute-Ero figure. Repriceable in the DB without a redeploy.
INSERT INTO "tipping_rates" ("id", "kobo_per_kg", "is_active", "updated_at")
SELECT gen_random_uuid(), 15000, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "tipping_rates" WHERE "is_active" = true);

-- Demo fleet. Ibrahim's low balance exists to demonstrate the
-- FLAGGED_NEGATIVE path (weigh anyway, flag, top up).
INSERT INTO "tricycles" ("id", "rfid_tag", "plate_number", "operator_name", "zone", "wallet_balance_kobo", "is_active")
SELECT gen_random_uuid(), v.tag, v.plate, v.op, v.zone, v.bal, true
FROM (VALUES
  ('TRC-4F2A9B', 'LSD-482-XA', 'Musa Adebayo',   'Lagos Island East', 1200000),
  ('TRC-9C31E7', 'LSD-119-KJ', 'Chidinma Okafor','Lagos Island West',  450000),
  ('TRC-A77D02', 'LSD-733-BC', 'Ibrahim Yusuf',  'Ebute-Ero Market',    95000),
  ('TRC-2B8F44', 'LSD-207-FN', 'Tunde Bakare',   'Idumota',           2500000)
) AS v(tag, plate, op, zone, bal)
WHERE NOT EXISTS (SELECT 1 FROM "tricycles" t WHERE t."rfid_tag" = v.tag);

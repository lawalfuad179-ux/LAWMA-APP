-- Tricycle operators have no app account — SMS is their notification channel
-- for docked fees, arrears and top-ups. Additive column + demo phone numbers
-- for the seeded fleet (fictional 0800-range numbers; keyed on rfid_tag and
-- only filled when still null, so re-running is a no-op and real data is
-- never overwritten).

ALTER TABLE "tricycles" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;

UPDATE "tricycles" t
SET "contact_phone" = v.phone
FROM (VALUES
  ('TRC-4F2A9B', '+2348000000101'),
  ('TRC-9C31E7', '+2348000000102'),
  ('TRC-A77D02', '+2348000000103'),
  ('TRC-2B8F44', '+2348000000104')
) AS v(tag, phone)
WHERE t."rfid_tag" = v.tag
  AND t."contact_phone" IS NULL;

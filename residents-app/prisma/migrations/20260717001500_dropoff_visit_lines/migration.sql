-- Turn a drop-off into a VISIT with per-material LINES.
--
-- A resident who sorted their waste brings metal + plastic + paper in one sack.
-- Modelling that as three drop-offs made the re-entry guard flag the most
-- co-operative residents, charged the queue three lookups for one person, and
-- made "residents served today" count materials instead of people.
--
-- Data-preserving: every existing drop-off becomes a visit with exactly one
-- line carrying its original material, weight and rate. Nothing is recomputed —
-- historical payouts keep the rate they were actually paid at.

-- ── New line table ────────────────────────────────────────────────────────
CREATE TABLE "drop_off_lines" (
    "id" TEXT NOT NULL,
    "drop_off_id" TEXT NOT NULL,
    "material" "DropOffMaterial" NOT NULL,
    "weight_grams" INTEGER NOT NULL,
    "rate_kobo_per_kg" INTEGER NOT NULL,
    "amount_kobo" INTEGER NOT NULL,

    CONSTRAINT "drop_off_lines_pkey" PRIMARY KEY ("id")
);

-- ── Backfill: each existing drop-off becomes a single-line visit ──────────
INSERT INTO "drop_off_lines" ("id", "drop_off_id", "material", "weight_grams", "rate_kobo_per_kg", "amount_kobo")
SELECT gen_random_uuid(), d."id", d."material", d."weight_grams", d."rate_kobo_per_kg", d."amount_kobo"
FROM "drop_offs" d;

-- ── Visit totals ──────────────────────────────────────────────────────────
-- Added nullable, backfilled from the old per-material columns, then locked to
-- NOT NULL — a plain NOT NULL add would fail on any existing row.
ALTER TABLE "drop_offs" ADD COLUMN "total_weight_grams" INTEGER;
ALTER TABLE "drop_offs" ADD COLUMN "total_amount_kobo" INTEGER;

UPDATE "drop_offs"
SET "total_weight_grams" = "weight_grams",
    "total_amount_kobo"  = "amount_kobo";

ALTER TABLE "drop_offs" ALTER COLUMN "total_weight_grams" SET NOT NULL;
ALTER TABLE "drop_offs" ALTER COLUMN "total_amount_kobo" SET NOT NULL;

-- ── Retire the per-material columns from the visit ────────────────────────
ALTER TABLE "drop_offs" DROP COLUMN "material";
ALTER TABLE "drop_offs" DROP COLUMN "weight_grams";
ALTER TABLE "drop_offs" DROP COLUMN "rate_kobo_per_kg";
ALTER TABLE "drop_offs" DROP COLUMN "amount_kobo";

-- ── Indexes + FK ──────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "drop_off_lines_drop_off_id_material_key" ON "drop_off_lines"("drop_off_id", "material");
CREATE INDEX "drop_off_lines_drop_off_id_idx" ON "drop_off_lines"("drop_off_id");
CREATE INDEX "drop_off_lines_material_idx" ON "drop_off_lines"("material");

ALTER TABLE "drop_off_lines"
  ADD CONSTRAINT "drop_off_lines_drop_off_id_fkey"
  FOREIGN KEY ("drop_off_id") REFERENCES "drop_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

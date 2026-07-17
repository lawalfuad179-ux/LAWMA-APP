-- Payout method per visit. CREDIT (default) lands in the app wallet; CASH is
-- handed over physically at the counter — the row still exists so every cash
-- naira reconciles to an operator and a receipt code. Additive and safe on
-- existing rows: everything recorded so far was wallet credit.
CREATE TYPE "PayoutMethod" AS ENUM ('CREDIT', 'CASH');

ALTER TABLE "drop_offs"
  ADD COLUMN "payout_method" "PayoutMethod" NOT NULL DEFAULT 'CREDIT';

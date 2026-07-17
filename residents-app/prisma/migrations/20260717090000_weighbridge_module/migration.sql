-- CreateEnum
CREATE TYPE "CenterKind" AS ENUM ('BUYBACK', 'TRANSFER_STATION');

-- CreateEnum
CREATE TYPE "WeighEventStatus" AS ENUM ('SETTLED', 'FLAGGED_NEGATIVE', 'VOID');

-- CreateEnum
CREATE TYPE "TricycleTxnType" AS ENUM ('TOPUP', 'TIPPING_FEE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "collection_centers" ADD COLUMN     "kind" "CenterKind" NOT NULL DEFAULT 'BUYBACK';

-- CreateTable
CREATE TABLE "tricycles" (
    "id" TEXT NOT NULL,
    "rfid_tag" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "wallet_balance_kobo" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tricycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipping_rates" (
    "id" TEXT NOT NULL,
    "kobo_per_kg" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weigh_events" (
    "id" TEXT NOT NULL,
    "tricycle_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "gross_weight_grams" INTEGER NOT NULL,
    "rate_kobo_per_kg" INTEGER NOT NULL,
    "fee_kobo" INTEGER NOT NULL,
    "balance_after_kobo" INTEGER NOT NULL,
    "status" "WeighEventStatus" NOT NULL DEFAULT 'SETTLED',
    "flag_reason" TEXT,
    "receipt_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weigh_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tricycle_wallet_transactions" (
    "id" TEXT NOT NULL,
    "tricycle_id" TEXT NOT NULL,
    "type" "TricycleTxnType" NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "balance_after_kobo" INTEGER NOT NULL,
    "weigh_event_id" TEXT,
    "operator_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tricycle_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tricycles_rfid_tag_key" ON "tricycles"("rfid_tag");

-- CreateIndex
CREATE INDEX "tricycles_zone_idx" ON "tricycles"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "weigh_events_receipt_code_key" ON "weigh_events"("receipt_code");

-- CreateIndex
CREATE INDEX "weigh_events_tricycle_id_created_at_idx" ON "weigh_events"("tricycle_id", "created_at");

-- CreateIndex
CREATE INDEX "weigh_events_station_id_created_at_idx" ON "weigh_events"("station_id", "created_at");

-- CreateIndex
CREATE INDEX "weigh_events_status_idx" ON "weigh_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tricycle_wallet_transactions_weigh_event_id_key" ON "tricycle_wallet_transactions"("weigh_event_id");

-- CreateIndex
CREATE INDEX "tricycle_wallet_transactions_tricycle_id_created_at_idx" ON "tricycle_wallet_transactions"("tricycle_id", "created_at");

-- AddForeignKey
ALTER TABLE "weigh_events" ADD CONSTRAINT "weigh_events_tricycle_id_fkey" FOREIGN KEY ("tricycle_id") REFERENCES "tricycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_events" ADD CONSTRAINT "weigh_events_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "collection_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_events" ADD CONSTRAINT "weigh_events_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "center_operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricycle_wallet_transactions" ADD CONSTRAINT "tricycle_wallet_transactions_tricycle_id_fkey" FOREIGN KEY ("tricycle_id") REFERENCES "tricycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricycle_wallet_transactions" ADD CONSTRAINT "tricycle_wallet_transactions_weigh_event_id_fkey" FOREIGN KEY ("weigh_event_id") REFERENCES "weigh_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Add discount_kobo column to bills (was missing from initial migration)
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "discount_kobo" INTEGER NOT NULL DEFAULT 0;

-- Add RECYCLING_REWARD to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RECYCLING_REWARD';

-- Create RecycleActivityStatus enum
DO $$ BEGIN
  CREATE TYPE "RecycleActivityStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create PointTransactionType enum
DO $$ BEGIN
  CREATE TYPE "PointTransactionType" AS ENUM ('EARNED_RECYCLING', 'REDEEMED_BILL_DISCOUNT', 'BONUS_FIRST_SCAN', 'ADMIN_ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable recycle_activities
CREATE TABLE IF NOT EXISTS "recycle_activities" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "ai_report" JSONB NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "status" "RecycleActivityStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recycle_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable reward_accounts
CREATE TABLE IF NOT EXISTS "reward_accounts" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_redeemed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable point_transactions
CREATE TABLE IF NOT EXISTS "point_transactions" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "activity_id" TEXT,
    "bill_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recycle_activities_resident_id_idx" ON "recycle_activities"("resident_id");
CREATE INDEX IF NOT EXISTS "recycle_activities_resident_id_status_idx" ON "recycle_activities"("resident_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reward_accounts_resident_id_key" ON "reward_accounts"("resident_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "point_transactions_resident_id_idx" ON "point_transactions"("resident_id");
CREATE INDEX IF NOT EXISTS "point_transactions_resident_id_created_at_idx" ON "point_transactions"("resident_id", "created_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "recycle_activities" ADD CONSTRAINT "recycle_activities_resident_id_fkey"
    FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "reward_accounts" ADD CONSTRAINT "reward_accounts_resident_id_fkey"
    FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_resident_id_fkey"
    FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_activity_id_fkey"
    FOREIGN KEY ("activity_id") REFERENCES "recycle_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

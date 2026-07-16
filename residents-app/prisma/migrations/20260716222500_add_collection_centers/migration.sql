-- CreateEnum
CREATE TYPE "DropOffMaterial" AS ENUM ('PLASTIC', 'PAPER', 'CARDBOARD', 'METAL', 'GLASS');

-- CreateEnum
CREATE TYPE "DropOffStatus" AS ENUM ('CONFIRMED', 'FLAGGED', 'VOIDED');

-- AlterEnum
ALTER TYPE "PointTransactionType" ADD VALUE IF NOT EXISTS 'EARNED_CENTER_DROPOFF';

-- AlterTable
ALTER TABLE "point_transactions" ADD COLUMN     "drop_off_id" TEXT;

-- CreateTable
CREATE TABLE "collection_centers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_operators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "staff_code" TEXT NOT NULL,
    "passcode_hash" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "center_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_sessions" (
    "id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "center_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_rates" (
    "id" TEXT NOT NULL,
    "material" "DropOffMaterial" NOT NULL,
    "kobo_per_kg" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_offs" (
    "id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "material" "DropOffMaterial" NOT NULL,
    "weight_grams" INTEGER NOT NULL,
    "rate_kobo_per_kg" INTEGER NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "status" "DropOffStatus" NOT NULL DEFAULT 'CONFIRMED',
    "flag_reason" TEXT,
    "receipt_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drop_offs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_centers_lga_idx" ON "collection_centers"("lga");

-- CreateIndex
CREATE UNIQUE INDEX "center_operators_staff_code_key" ON "center_operators"("staff_code");

-- CreateIndex
CREATE INDEX "center_operators_center_id_idx" ON "center_operators"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "center_sessions_token_key" ON "center_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "material_rates_material_key" ON "material_rates"("material");

-- CreateIndex
CREATE UNIQUE INDEX "drop_offs_receipt_code_key" ON "drop_offs"("receipt_code");

-- CreateIndex
CREATE INDEX "drop_offs_resident_id_idx" ON "drop_offs"("resident_id");

-- CreateIndex
CREATE INDEX "drop_offs_resident_id_created_at_idx" ON "drop_offs"("resident_id", "created_at");

-- CreateIndex
CREATE INDEX "drop_offs_center_id_created_at_idx" ON "drop_offs"("center_id", "created_at");

-- CreateIndex
CREATE INDEX "drop_offs_operator_id_created_at_idx" ON "drop_offs"("operator_id", "created_at");

-- CreateIndex
CREATE INDEX "drop_offs_status_idx" ON "drop_offs"("status");

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_drop_off_id_fkey" FOREIGN KEY ("drop_off_id") REFERENCES "drop_offs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_operators" ADD CONSTRAINT "center_operators_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "collection_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_sessions" ADD CONSTRAINT "center_sessions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "center_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_offs" ADD CONSTRAINT "drop_offs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "collection_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_offs" ADD CONSTRAINT "drop_offs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "center_operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_offs" ADD CONSTRAINT "drop_offs_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

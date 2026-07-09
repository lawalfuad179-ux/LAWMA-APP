-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('SCHEDULED', 'DELAYED', 'MISSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COLLECTION_REMINDER', 'DELAYED_PICKUP', 'COMPLAINT_UPDATE', 'PAYMENT_CONFIRMATION', 'ANNOUNCEMENT');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "collection_schedules" ADD COLUMN     "delay_reason" TEXT,
ADD COLUMN     "next_collection_date" TIMESTAMP(3),
ADD COLUMN     "status" "CollectionStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "ticket_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "reference_id" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "flutterwave_transaction_id" TEXT,
ADD COLUMN     "receipt_number" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "email" TEXT,
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN     "onboarding_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "email_complaint_updates" BOOLEAN NOT NULL DEFAULT true,
    "email_payment_receipts" BOOLEAN NOT NULL DEFAULT true,
    "email_collection_reminders" BOOLEAN NOT NULL DEFAULT true,
    "email_announcements" BOOLEAN NOT NULL DEFAULT false,
    "sms_complaint_updates" BOOLEAN NOT NULL DEFAULT true,
    "sms_collection_reminders" BOOLEAN NOT NULL DEFAULT true,
    "sms_delayed_pickup" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_outbox_status_idx" ON "email_outbox"("status");

-- CreateIndex
CREATE INDEX "email_outbox_created_at_idx" ON "email_outbox"("created_at");

-- CreateIndex
CREATE INDEX "email_outbox_recipient_idx" ON "email_outbox"("recipient");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_resident_id_key" ON "notification_preferences"("resident_id");

-- CreateIndex
CREATE INDEX "bills_resident_id_status_idx" ON "bills"("resident_id", "status");

-- CreateIndex
CREATE INDEX "bills_due_date_idx" ON "bills"("due_date");

-- CreateIndex
CREATE INDEX "collection_schedules_lga_day_of_week_idx" ON "collection_schedules"("lga", "day_of_week");

-- CreateIndex
CREATE INDEX "collection_schedules_status_idx" ON "collection_schedules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_ticket_id_key" ON "complaints"("ticket_id");

-- CreateIndex
CREATE INDEX "complaints_lga_area_issue_type_status_idx" ON "complaints"("lga", "area", "issue_type", "status");

-- CreateIndex
CREATE INDEX "complaints_ticket_id_idx" ON "complaints"("ticket_id");

-- CreateIndex
CREATE INDEX "notifications_resident_id_is_read_idx" ON "notifications"("resident_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE INDEX "payments_resident_id_status_idx" ON "payments"("resident_id", "status");

-- CreateIndex
CREATE INDEX "psp_operators_lga_idx" ON "psp_operators"("lga");

-- CreateIndex
CREATE UNIQUE INDEX "residents_email_key" ON "residents"("email");

-- CreateIndex
CREATE INDEX "residents_lga_idx" ON "residents"("lga");

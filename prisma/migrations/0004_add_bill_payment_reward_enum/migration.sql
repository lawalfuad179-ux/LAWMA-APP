-- Add EARNED_BILL_PAYMENT to PointTransactionType for the new
-- bill-payment reward path (recycling no longer earns points).
ALTER TYPE "PointTransactionType" ADD VALUE IF NOT EXISTS 'EARNED_BILL_PAYMENT';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "billingCycleStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Align historical rows to the team creation date for the initial billing cycle anchor.
UPDATE "Team" SET "billingCycleStartAt" = "createdAt";

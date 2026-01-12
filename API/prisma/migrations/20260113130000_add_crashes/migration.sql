-- Add crashes to TrackingService enum
ALTER TYPE "TrackingService" ADD VALUE IF NOT EXISTS 'crashes';

-- Add crash-specific columns
ALTER TABLE "TrackingEvent"
  ADD COLUMN IF NOT EXISTS "crash" JSONB,
  ADD COLUMN IF NOT EXISTS "environment" TEXT,
  ADD COLUMN IF NOT EXISTS "binaryHash" TEXT,
  ADD COLUMN IF NOT EXISTS "signingCertHash" TEXT;

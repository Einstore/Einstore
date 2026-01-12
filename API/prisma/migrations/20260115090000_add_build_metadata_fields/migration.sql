-- Add optional metadata fields to builds
ALTER TABLE "Build" ADD COLUMN "gitCommit" TEXT;
ALTER TABLE "Build" ADD COLUMN "prUrl" TEXT;
ALTER TABLE "Build" ADD COLUMN "changeLog" TEXT;
ALTER TABLE "Build" ADD COLUMN "notes" TEXT;
ALTER TABLE "Build" ADD COLUMN "info" JSONB;

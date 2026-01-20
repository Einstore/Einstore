-- Add type column for API key scoping
CREATE TYPE "ApiKeyType" AS ENUM ('upload', 'updates');

ALTER TABLE "ApiKey"
ADD COLUMN "type" "ApiKeyType" NOT NULL DEFAULT 'upload';

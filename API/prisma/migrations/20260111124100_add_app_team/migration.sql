-- Add team ownership to apps
ALTER TABLE "App" ADD COLUMN "teamId" TEXT;

-- Backfill existing apps to the oldest team if possible
UPDATE "App"
SET "teamId" = (
  SELECT "id" FROM "Team" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "teamId" IS NULL;

ALTER TABLE "App" ALTER COLUMN "teamId" SET NOT NULL;

ALTER TABLE "App" ADD CONSTRAINT "App_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "App_identifier_key";
CREATE UNIQUE INDEX "App_teamId_identifier_key" ON "App"("teamId", "identifier");
CREATE INDEX "App_teamId_idx" ON "App"("teamId");

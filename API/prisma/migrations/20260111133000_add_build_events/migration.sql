CREATE TYPE "BuildEventKind" AS ENUM ('download', 'install');

ALTER TABLE "Build"
ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "Build"
ADD CONSTRAINT "Build_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Build_createdByUserId_idx" ON "Build"("createdByUserId");

CREATE TABLE "BuildEvent" (
  "id" TEXT NOT NULL,
  "buildId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT,
  "kind" "BuildEventKind" NOT NULL,
  "platform" "PlatformKind",
  "targetId" TEXT,
  "deviceId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "BuildEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BuildEvent"
ADD CONSTRAINT "BuildEvent_buildId_fkey"
FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuildEvent"
ADD CONSTRAINT "BuildEvent_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuildEvent"
ADD CONSTRAINT "BuildEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BuildEvent_buildId_idx" ON "BuildEvent"("buildId");
CREATE INDEX "BuildEvent_teamId_idx" ON "BuildEvent"("teamId");
CREATE INDEX "BuildEvent_userId_idx" ON "BuildEvent"("userId");
CREATE INDEX "BuildEvent_kind_idx" ON "BuildEvent"("kind");

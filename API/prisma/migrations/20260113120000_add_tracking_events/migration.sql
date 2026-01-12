-- CreateEnum
CREATE TYPE "TrackingService" AS ENUM ('analytics', 'errors', 'distribution', 'devices', 'usage');

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" "PlatformKind",
    "targetId" TEXT,
    "deviceId" TEXT,
    "service" "TrackingService" NOT NULL,
    "eventName" TEXT,
    "message" TEXT,
    "stackTrace" TEXT,
    "sessionId" TEXT,
    "sessionStartedAt" TIMESTAMP(3),
    "sessionDurationMs" INTEGER,
    "timeZone" TEXT,
    "timeZoneOffsetMinutes" INTEGER,
    "locale" TEXT,
    "deviceModel" TEXT,
    "deviceManufacturer" TEXT,
    "deviceOsVersion" TEXT,
    "deviceAppVersion" TEXT,
    "deviceBuildNumber" TEXT,
    "installSource" TEXT,
    "appVersion" TEXT,
    "buildNumber" TEXT,
    "eventProperties" JSONB,
    "userProperties" JSONB,
    "distribution" JSONB,
    "device" JSONB,
    "usage" JSONB,
    "custom" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackingEvent_buildId_idx" ON "TrackingEvent"("buildId");

-- CreateIndex
CREATE INDEX "TrackingEvent_teamId_idx" ON "TrackingEvent"("teamId");

-- CreateIndex
CREATE INDEX "TrackingEvent_service_idx" ON "TrackingEvent"("service");

-- CreateIndex
CREATE INDEX "TrackingEvent_occurredAt_idx" ON "TrackingEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

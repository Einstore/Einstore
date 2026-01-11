-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "TeamVertical" AS ENUM ('regular', 'hospitality', 'retail');

-- CreateEnum
CREATE TYPE "ExportPreset" AS ENUM ('global', 'us', 'gb', 'ca', 'au', 'de', 'fr');

-- CreateEnum
CREATE TYPE "OverviewStatsPeriod" AS ENUM ('rolling_30_days', 'calendar_month');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isSuperUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveTeamId" TEXT;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vertical" "TeamVertical" NOT NULL DEFAULT 'regular',
    "inboxBase" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'free',
    "planLimit" INTEGER NOT NULL DEFAULT 25,
    "planPriceOverrideOne" INTEGER,
    "planPriceOverrideTeam" INTEGER,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "billingInterval" TEXT,
    "billingCurrency" TEXT DEFAULT 'GBP',
    "seatBundleCount" INTEGER NOT NULL DEFAULT 1,
    "storageAddOnCount" INTEGER NOT NULL DEFAULT 0,
    "integrationAddOnCount" INTEGER NOT NULL DEFAULT 0,
    "prioritySupportAddOnCount" INTEGER NOT NULL DEFAULT 0,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "defaultCurrency" TEXT DEFAULT 'GBP',
    "country" TEXT,
    "timezone" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "vatMissingThresholdMinor" INTEGER,
    "vatNumberRequired" BOOLEAN NOT NULL DEFAULT false,
    "categoryRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultExportPreset" "ExportPreset" NOT NULL DEFAULT 'global',
    "storageLimitBytes" BIGINT NOT NULL DEFAULT 1073741824,
    "overviewStatsPeriod" "OverviewStatsPeriod" NOT NULL DEFAULT 'rolling_30_days',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeamSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTeamSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Team_stripeCustomerId_key" ON "Team"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_stripeSubscriptionId_key" ON "Team"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "UserTeamSetting_teamId_idx" ON "UserTeamSetting"("teamId");

-- CreateIndex
CREATE INDEX "UserTeamSetting_userId_idx" ON "UserTeamSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeamSetting_userId_teamId_key_key" ON "UserTeamSetting"("userId", "teamId", "key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastActiveTeamId_fkey" FOREIGN KEY ("lastActiveTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeamSetting" ADD CONSTRAINT "UserTeamSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeamSetting" ADD CONSTRAINT "UserTeamSetting_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

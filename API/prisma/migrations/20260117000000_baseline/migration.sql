-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformKind" AS ENUM ('ios', 'watchos', 'tvos', 'visionos', 'android', 'wearos', 'auto');

-- CreateEnum
CREATE TYPE "TargetRole" AS ENUM ('app', 'extension', 'widget', 'clip', 'feature');

-- CreateEnum
CREATE TYPE "VariantKind" AS ENUM ('abi', 'density', 'language', 'device');

-- CreateEnum
CREATE TYPE "ArtifactKind" AS ENUM ('privacy_manifest', 'provisioning_profile', 'entitlements', 'permissions', 'signing_info', 'icon_set', 'manifest');

-- CreateEnum
CREATE TYPE "StorageKind" AS ENUM ('local', 's3');

-- CreateEnum
CREATE TYPE "BuildEventKind" AS ENUM ('download', 'install');

-- CreateEnum
CREATE TYPE "TrackingService" AS ENUM ('analytics', 'errors', 'distribution', 'devices', 'usage', 'crashes');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "TeamVertical" AS ENUM ('regular', 'hospitality', 'retail');

-- CreateEnum
CREATE TYPE "ExportPreset" AS ENUM ('global', 'us', 'gb', 'ca', 'au', 'de', 'fr');

-- CreateEnum
CREATE TYPE "OverviewStatsPeriod" AS ENUM ('rolling_30_days', 'calendar_month');

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storageKind" "StorageKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "gitCommit" TEXT,
    "prUrl" TEXT,
    "changeLog" TEXT,
    "notes" TEXT,
    "info" JSONB,
    "createdByUserId" TEXT,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "platform" "PlatformKind" NOT NULL,
    "role" "TargetRole" NOT NULL,
    "bundleId" TEXT NOT NULL,
    "hostTargetId" TEXT,
    "minOsVersion" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "kind" "VariantKind" NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "onDemand" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceArtifact" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "kind" "ArtifactKind" NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "storageKind" "StorageKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SigningIdentity" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "issuer" TEXT,
    "subject" TEXT,
    "serial" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SigningIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'platform',
    "targetKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "isSuperUser" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordAlgo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "codeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vertical" "TeamVertical" NOT NULL DEFAULT 'regular',
    "inboxBase" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
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

-- CreateTable
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildEvent_pkey" PRIMARY KEY ("id")
);

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
    "crash" JSONB,
    "environment" TEXT,
    "binaryHash" TEXT,
    "signingCertHash" TEXT,
    "custom" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "allowedDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildTag" (
    "buildId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildTag_pkey" PRIMARY KEY ("buildId","tagId")
);

-- CreateIndex
CREATE INDEX "App_teamId_idx" ON "App"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "App_teamId_identifier_key" ON "App"("teamId", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Version_appId_version_key" ON "Version"("appId", "version");

-- CreateIndex
CREATE INDEX "Build_versionId_idx" ON "Build"("versionId");

-- CreateIndex
CREATE INDEX "Build_createdByUserId_idx" ON "Build"("createdByUserId");

-- CreateIndex
CREATE INDEX "Comment_parentId_category_idx" ON "Comment"("parentId", "category");

-- CreateIndex
CREATE INDEX "Target_buildId_idx" ON "Target"("buildId");

-- CreateIndex
CREATE INDEX "Target_bundleId_idx" ON "Target"("bundleId");

-- CreateIndex
CREATE INDEX "Variant_buildId_idx" ON "Variant"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_buildId_name_key" ON "Module"("buildId", "name");

-- CreateIndex
CREATE INDEX "Capability_targetId_idx" ON "Capability"("targetId");

-- CreateIndex
CREATE INDEX "ComplianceArtifact_buildId_idx" ON "ComplianceArtifact"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "SigningIdentity_buildId_key" ON "SigningIdentity"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlagOverride_flagId_idx" ON "FeatureFlagOverride"("flagId");

-- CreateIndex
CREATE INDEX "FeatureFlagOverride_scope_targetKey_idx" ON "FeatureFlagOverride"("scope", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagOverride_flagId_scope_targetKey_key" ON "FeatureFlagOverride"("flagId", "scope", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_tokenHash_key" ON "ApiKey"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiKey_teamId_idx" ON "ApiKey"("teamId");

-- CreateIndex
CREATE INDEX "ApiKey_tokenPrefix_idx" ON "ApiKey"("tokenPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_createdByUserId_idx" ON "ApiKey"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential"("userId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerUserId_key" ON "OAuthAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCode_codeHash_key" ON "AuthCode"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "UserTeamSetting_teamId_idx" ON "UserTeamSetting"("teamId");

-- CreateIndex
CREATE INDEX "UserTeamSetting_userId_idx" ON "UserTeamSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeamSetting_userId_teamId_key_key" ON "UserTeamSetting"("userId", "teamId", "key");

-- CreateIndex
CREATE INDEX "BuildEvent_buildId_idx" ON "BuildEvent"("buildId");

-- CreateIndex
CREATE INDEX "BuildEvent_teamId_idx" ON "BuildEvent"("teamId");

-- CreateIndex
CREATE INDEX "BuildEvent_userId_idx" ON "BuildEvent"("userId");

-- CreateIndex
CREATE INDEX "BuildEvent_kind_idx" ON "BuildEvent"("kind");

-- CreateIndex
CREATE INDEX "TrackingEvent_buildId_idx" ON "TrackingEvent"("buildId");

-- CreateIndex
CREATE INDEX "TrackingEvent_teamId_idx" ON "TrackingEvent"("teamId");

-- CreateIndex
CREATE INDEX "TrackingEvent_service_idx" ON "TrackingEvent"("service");

-- CreateIndex
CREATE INDEX "TrackingEvent_occurredAt_idx" ON "TrackingEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_idx" ON "TeamInvite"("teamId");

-- CreateIndex
CREATE INDEX "Tag_teamId_normalizedName_idx" ON "Tag"("teamId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_teamId_normalizedName_key" ON "Tag"("teamId", "normalizedName");

-- CreateIndex
CREATE INDEX "BuildTag_tagId_idx" ON "BuildTag"("tagId");

-- CreateIndex
CREATE INDEX "BuildTag_buildId_idx" ON "BuildTag"("buildId");

-- AddForeignKey
ALTER TABLE "App" ADD CONSTRAINT "App_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_hostTargetId_fkey" FOREIGN KEY ("hostTargetId") REFERENCES "Target"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Target"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceArtifact" ADD CONSTRAINT "ComplianceArtifact_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigningIdentity" ADD CONSTRAINT "SigningIdentity_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlagOverride" ADD CONSTRAINT "FeatureFlagOverride_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastActiveTeamId_fkey" FOREIGN KEY ("lastActiveTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "BuildEvent" ADD CONSTRAINT "BuildEvent_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildEvent" ADD CONSTRAINT "BuildEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildEvent" ADD CONSTRAINT "BuildEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTag" ADD CONSTRAINT "BuildTag_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTag" ADD CONSTRAINT "BuildTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;


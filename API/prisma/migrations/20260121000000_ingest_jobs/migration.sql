-- CreateEnum
CREATE TYPE "IngestJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "IngestJob" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "status" "IngestJobStatus" NOT NULL DEFAULT 'queued',
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "callbackTokenHash" TEXT NOT NULL,
    "errorMessage" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestJob_teamId_idx" ON "IngestJob"("teamId");

-- CreateIndex
CREATE INDEX "IngestJob_createdByUserId_idx" ON "IngestJob"("createdByUserId");

-- CreateIndex
CREATE INDEX "IngestJob_status_idx" ON "IngestJob"("status");

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

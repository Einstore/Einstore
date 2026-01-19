-- CreateTable
CREATE TABLE "TeamLimitOverride" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "maxUsers" INTEGER,
    "maxApps" INTEGER,
    "storageLimitBytes" BIGINT,
    "transferLimitBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamLimitOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamLimitOverride_teamId_key" ON "TeamLimitOverride"("teamId");

-- AddForeignKey
ALTER TABLE "TeamLimitOverride" ADD CONSTRAINT "TeamLimitOverride_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

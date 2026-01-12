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
CREATE INDEX "Tag_teamId_normalizedName_idx" ON "Tag"("teamId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_teamId_normalizedName_key" ON "Tag"("teamId", "normalizedName");

-- CreateIndex
CREATE INDEX "BuildTag_tagId_idx" ON "BuildTag"("tagId");

-- CreateIndex
CREATE INDEX "BuildTag_buildId_idx" ON "BuildTag"("buildId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTag" ADD CONSTRAINT "BuildTag_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTag" ADD CONSTRAINT "BuildTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

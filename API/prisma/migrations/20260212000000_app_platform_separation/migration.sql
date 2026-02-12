-- Add nullable platform column to App
ALTER TABLE "App" ADD COLUMN "platform" "PlatformKind";

-- Backfill apps that have builds from exactly one platform
WITH app_single_platform AS (
  SELECT v."appId", MIN(t."platform") AS "platform"
  FROM "Version" v
  JOIN "Build" b ON b."versionId" = v."id"
  JOIN "Target" t ON t."buildId" = b."id" AND t."role" = 'app'
  GROUP BY v."appId"
  HAVING COUNT(DISTINCT t."platform") = 1
)
UPDATE "App" a
SET "platform" = sp."platform"
FROM app_single_platform sp
WHERE a."id" = sp."appId";

-- Drop the old unique index BEFORE inserting split rows, because the
-- new rows share the same (teamId, identifier) but differ on platform.
DROP INDEX "App_teamId_identifier_key";

-- Split apps that have builds from multiple platforms
DO $$
DECLARE
  app_row RECORD;
  plat "PlatformKind";
  primary_plat "PlatformKind";
  new_app_id UUID;
  ver_row RECORD;
  new_ver_id UUID;
BEGIN
  FOR app_row IN
    SELECT a."id", a."teamId", a."name", a."identifier", a."createdAt"
    FROM "App" a
    WHERE a."platform" IS NULL
      AND EXISTS (
        SELECT 1 FROM "Version" v
        JOIN "Build" b ON b."versionId" = v."id"
        JOIN "Target" t ON t."buildId" = b."id" AND t."role" = 'app'
        WHERE v."appId" = a."id"
      )
  LOOP
    -- Pick the platform with the most builds as primary
    SELECT t."platform" INTO primary_plat
    FROM "Version" v
    JOIN "Build" b ON b."versionId" = v."id"
    JOIN "Target" t ON t."buildId" = b."id" AND t."role" = 'app'
    WHERE v."appId" = app_row."id"
    GROUP BY t."platform"
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    UPDATE "App" SET "platform" = primary_plat WHERE "id" = app_row."id";

    -- Create new App records for each secondary platform
    FOR plat IN
      SELECT DISTINCT t."platform"
      FROM "Version" v
      JOIN "Build" b ON b."versionId" = v."id"
      JOIN "Target" t ON t."buildId" = b."id" AND t."role" = 'app'
      WHERE v."appId" = app_row."id"
        AND t."platform" != primary_plat
    LOOP
      new_app_id := gen_random_uuid();
      INSERT INTO "App" ("id", "teamId", "name", "identifier", "platform", "createdAt", "updatedAt")
      VALUES (new_app_id, app_row."teamId", app_row."name", app_row."identifier", plat, app_row."createdAt", NOW());

      -- For each version that has builds on this platform, create a
      -- mirror version under the new app and move the builds over.
      FOR ver_row IN
        SELECT DISTINCT v."id" AS ver_id, v."version", v."createdAt"
        FROM "Version" v
        JOIN "Build" b ON b."versionId" = v."id"
        JOIN "Target" t ON t."buildId" = b."id" AND t."role" = 'app'
        WHERE v."appId" = app_row."id"
          AND t."platform" = plat
      LOOP
        new_ver_id := gen_random_uuid();
        INSERT INTO "Version" ("id", "appId", "version", "createdAt", "updatedAt")
        VALUES (new_ver_id, new_app_id, ver_row."version", ver_row."createdAt", NOW());

        -- Move builds whose primary target matches this platform
        UPDATE "Build" b SET "versionId" = new_ver_id
        WHERE b."versionId" = ver_row.ver_id
          AND EXISTS (
            SELECT 1 FROM "Target" t
            WHERE t."buildId" = b."id" AND t."role" = 'app' AND t."platform" = plat
          );
      END LOOP;

      -- Remove empty versions left behind on the original app
      DELETE FROM "Version" v
      WHERE v."appId" = app_row."id"
        AND NOT EXISTS (SELECT 1 FROM "Build" b WHERE b."versionId" = v."id");
    END LOOP;
  END LOOP;
END $$;

-- Default apps with no builds to 'ios' (arbitrary safe default)
UPDATE "App" SET "platform" = 'ios' WHERE "platform" IS NULL;

-- Make column NOT NULL
ALTER TABLE "App" ALTER COLUMN "platform" SET NOT NULL;

-- Add the new unique index
CREATE UNIQUE INDEX "App_teamId_identifier_platform_key" ON "App"("teamId", "identifier", "platform");

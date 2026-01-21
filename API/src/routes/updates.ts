import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireApiKey } from "../auth/guard.js";
import { generateInstallToken } from "../lib/install-links.js";
import { prisma } from "../lib/prisma.js";

const checkSchema = z.object({
  bundleId: z.string().trim().min(1),
  version: z.string().trim().min(1).optional(),
  build: z.string().trim().min(1).optional(),
  lastUpdated: z.string().datetime().optional(),
});

const INSTALL_TTL_SECONDS = 300;
const versionCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const resolveBaseUrl = (request: { headers: Record<string, string | string[] | undefined> }) => {
  if (process.env.INSTALL_BASE_URL) {
    return process.env.INSTALL_BASE_URL.replace(/\/$/, "");
  }
  const protoHeader = request.headers["x-forwarded-proto"];
  const hostHeader = request.headers["x-forwarded-host"] ?? request.headers["host"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const safeHost = typeof host === "string" && /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? host : null;
  if (!safeHost) {
    return "https://api.einstore.pro";
  }
  const scheme = proto === "http" || proto === "https" ? proto : "https";
  return `${scheme}://${safeHost}`;
};

const isIosPlatform = (platform?: string | null) => {
  const value = (platform ?? "").toLowerCase();
  return value === "ios" || value === "tvos" || value === "watchos" || value === "visionos";
};

const compareVersions = (latest: string, current: string) => versionCollator.compare(latest, current);

const compareBuildNumbers = (latest: string, current: string) => {
  const latestNum = Number(latest);
  const currentNum = Number(current);
  if (Number.isFinite(latestNum) && Number.isFinite(currentNum)) {
    if (latestNum === currentNum) return 0;
    return latestNum > currentNum ? 1 : -1;
  }
  return versionCollator.compare(latest, current);
};

export async function updatesRoutes(app: FastifyInstance) {
  app.post(
    "/updates/check",
    { preHandler: requireApiKey({ types: ["updates"] }) },
    async (request, reply) => {
      const parsed = checkSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid payload" });
      }

      const teamId = request.team?.id;
      if (!teamId) {
        return reply.status(403).send({ error: "team_required", message: "Team context required" });
      }

      const appRecord = await prisma.app.findFirst({
        where: { teamId, identifier: parsed.data.bundleId },
        select: { id: true },
      });
      if (!appRecord) {
        return reply.send({ updateAvailable: false, latest: null });
      }

      const build = await prisma.build.findFirst({
        where: { version: { appId: appRecord.id } },
        orderBy: { createdAt: "desc" },
        include: {
          version: { select: { id: true, version: true, appId: true } },
          targets: { where: { role: "app" }, select: { platform: true } },
        },
      });

      if (!build) {
        return reply.send({ updateAvailable: false, latest: null });
      }

      const latestPlatform = build.targets[0]?.platform ?? null;
      const latest = {
        appId: build.version.appId,
        versionId: build.version.id,
        buildId: build.id,
        version: build.version.version,
        buildNumber: build.buildNumber,
        displayName: build.displayName,
        createdAt: build.createdAt.toISOString(),
        platform: latestPlatform,
      };

      let updateAvailable = false;
      if (parsed.data.lastUpdated) {
        const lastUpdated = new Date(parsed.data.lastUpdated);
        if (!Number.isNaN(lastUpdated.getTime())) {
          updateAvailable = build.createdAt > lastUpdated;
        }
      } else if (parsed.data.version || parsed.data.build) {
        if (parsed.data.version) {
          const comparison = compareVersions(build.version.version, parsed.data.version);
          if (comparison > 0) {
            updateAvailable = true;
          } else if (comparison === 0 && parsed.data.build) {
            updateAvailable = compareBuildNumbers(build.buildNumber, parsed.data.build) > 0;
          }
        } else if (parsed.data.build) {
          updateAvailable = compareBuildNumbers(build.buildNumber, parsed.data.build) > 0;
        }
      }

      const baseUrl = resolveBaseUrl(request);
      const expiresAt = new Date(Date.now() + INSTALL_TTL_SECONDS * 1000).toISOString();
      let storeUrl: string | null = null;
      let downloadUrl: string | null = null;

      if (updateAvailable) {
        const downloadToken = generateInstallToken(
          { buildId: build.id, teamId, action: "download" },
          INSTALL_TTL_SECONDS,
        );
        downloadUrl = `${baseUrl}/builds/${build.id}/ios/download?token=${downloadToken}`;
        if (isIosPlatform(latestPlatform)) {
          const manifestToken = generateInstallToken(
            { buildId: build.id, teamId, action: "manifest" },
            INSTALL_TTL_SECONDS,
          );
          const manifestUrl = `${baseUrl}/builds/${build.id}/ios/manifest?token=${manifestToken}`;
          storeUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(
            manifestUrl,
          )}`;
        } else {
          storeUrl = downloadUrl;
        }
      }

      return reply.send({
        updateAvailable,
        latest,
        storeUrl,
        downloadUrl,
        expiresAt: updateAvailable ? expiresAt : null,
      });
    },
  );
}

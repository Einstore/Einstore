import { FastifyInstance } from "fastify";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { generateInstallToken, verifyInstallToken } from "../lib/install-links.js";
import { presignStorageObject } from "../lib/storage-presign.js";
import { loadConfig } from "../lib/config.js";
import { BuildEventKind, PlatformKind, Prisma } from "@prisma/client";

const INSTALL_TTL_SECONDS = 300;
const config = loadConfig();

const installEventSchema = z.object({
  platform: z.nativeEnum(PlatformKind).optional(),
  targetId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sanitizeFileFragment = (value: string, fallback: string, allowDots = false) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const pattern = allowDots ? /[^a-z0-9.]+/gi : /[^a-z0-9]+/gi;
  const cleaned = trimmed.toLowerCase().replace(pattern, "-").replace(/(^-|-$)/g, "");
  return cleaned || fallback;
};

const resolveDownloadFilename = (build: {
  buildNumber: string;
  storagePath: string;
  version: { version: string; app: { name: string } };
}) => {
  const appName = sanitizeFileFragment(build.version.app.name ?? "", "app");
  const version = sanitizeFileFragment(build.version.version ?? "", "0", true);
  const buildNumber = sanitizeFileFragment(build.buildNumber ?? "", "0", true);
  const ext = path.extname(build.storagePath).replace(".", "");
  const safeExt = ext ? ext.toLowerCase() : "bin";
  return `${appName}_v${version}_${buildNumber}.${safeExt}`;
};

const buildContentDisposition = (filename: string) => {
  const safe = filename.replace(/"/g, "");
  return `attachment; filename="${safe}"`;
};

const resolveBaseUrl = (request: { headers: Record<string, string | string[] | undefined> }) => {
  if (config.INSTALL_BASE_URL) {
    return config.INSTALL_BASE_URL.replace(/\/$/, "");
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

const buildManifest = (payload: {
  title: string;
  bundleId: string;
  version: string;
  buildNumber: string;
  downloadUrl: string;
}) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    "<dict>",
    "  <key>items</key>",
    "  <array>",
    "    <dict>",
    "      <key>assets</key>",
    "      <array>",
    "        <dict>",
    "          <key>kind</key>",
    "          <string>software-package</string>",
    "          <key>url</key>",
    `          <string>${xmlEscape(payload.downloadUrl)}</string>`,
    "        </dict>",
    "      </array>",
    "      <key>metadata</key>",
    "      <dict>",
    "        <key>bundle-identifier</key>",
    `        <string>${xmlEscape(payload.bundleId)}</string>`,
    "        <key>bundle-version</key>",
    `        <string>${xmlEscape(payload.version)}</string>`,
    "        <key>kind</key>",
    "        <string>software</string>",
    "        <key>title</key>",
    `        <string>${xmlEscape(payload.title)}</string>`,
    "        <key>build-number</key>",
    `        <string>${xmlEscape(payload.buildNumber)}</string>`,
    "      </dict>",
    "    </dict>",
    "  </array>",
    "</dict>",
    "</plist>",
  ].join("\n");
};

export async function iosInstallRoutes(app: FastifyInstance) {
  app.post("/builds/:id/ios/install-link", { preHandler: requireTeam }, async (request, reply) => {
    const buildId = (request.params as { id: string }).id;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const build = await prisma.build.findFirst({
      where: { id: buildId, version: { app: { teamId } } },
      select: { id: true },
    });
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const userId = request.auth?.user.id;
    const manifestToken = generateInstallToken(
      { buildId, teamId, userId, action: "manifest" },
      INSTALL_TTL_SECONDS,
    );
    const downloadToken = generateInstallToken(
      { buildId, teamId, userId, action: "download" },
      INSTALL_TTL_SECONDS,
    );
    const installToken = generateInstallToken(
      { buildId, teamId, userId, action: "install" },
      INSTALL_TTL_SECONDS,
    );

    const baseUrl = resolveBaseUrl(request);
    const manifestUrl = `${baseUrl}/builds/${buildId}/ios/manifest?token=${manifestToken}`;
    const itmsServicesUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(
      manifestUrl,
    )}`;
    const downloadUrl = `${baseUrl}/builds/${buildId}/ios/download?token=${downloadToken}`;
    const installTrackUrl = `${baseUrl}/builds/${buildId}/ios/installs/track?token=${installToken}`;
    const expiresAt = new Date(Date.now() + INSTALL_TTL_SECONDS * 1000).toISOString();

    return reply.send({ manifestUrl, itmsServicesUrl, downloadUrl, installTrackUrl, expiresAt });
  });

  app.get("/builds/:id/ios/manifest", async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(401).send({ error: "token_invalid" });
    }
    const payload = verifyInstallToken(token, "manifest");
    if (!payload) {
      return reply.status(401).send({ error: "token_invalid" });
    }

    const build = await prisma.build.findFirst({
      where: { id: payload.buildId, version: { app: { teamId: payload.teamId } } },
      include: { version: { include: { app: true } } },
    });
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const baseUrl = resolveBaseUrl(request);
    const downloadToken = generateInstallToken(
      {
        buildId: build.id,
        teamId: payload.teamId,
        userId: payload.userId,
        action: "download",
      },
      INSTALL_TTL_SECONDS,
    );
    let downloadUrl = `${baseUrl}/builds/${build.id}/ios/download?token=${downloadToken}`;
    if (build.storageKind === "s3") {
      const filename = resolveDownloadFilename(build);
      await prisma.buildEvent.create({
        data: {
          buildId: build.id,
          teamId: payload.teamId,
          userId: payload.userId,
          kind: BuildEventKind.download,
          platform: PlatformKind.ios,
          ip: request.ip,
          userAgent: typeof request.headers["user-agent"] === "string"
            ? request.headers["user-agent"]
            : undefined,
        },
      });
      const bucket = process.env.SPACES_BUCKET;
      if (!bucket) {
        return reply.status(500).send({ error: "storage_not_configured" });
      }
      downloadUrl = await presignStorageObject({
        bucket,
        key: build.storagePath,
        expiresIn: INSTALL_TTL_SECONDS,
        responseContentDisposition: buildContentDisposition(filename),
      });
    }

    const plist = buildManifest({
      title: build.displayName,
      bundleId: build.version.app.identifier,
      version: build.version.version,
      buildNumber: build.buildNumber,
      downloadUrl,
    });

    reply.header("Content-Type", "application/xml");
    return reply.send(plist);
  });

  app.get("/builds/:id/ios/download", async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(401).send({ error: "token_invalid" });
    }
    const payload = verifyInstallToken(token, "download");
    if (!payload) {
      return reply.status(401).send({ error: "token_invalid" });
    }

    const build = await prisma.build.findFirst({
      where: { id: payload.buildId, version: { app: { teamId: payload.teamId } } },
      include: { version: { include: { app: true } } },
    });
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    await prisma.buildEvent.create({
      data: {
        buildId: build.id,
        teamId: payload.teamId,
        userId: payload.userId,
        kind: BuildEventKind.download,
        platform: PlatformKind.ios,
        ip: request.ip,
        userAgent: typeof request.headers["user-agent"] === "string"
          ? request.headers["user-agent"]
          : undefined,
      },
    });

    const filename = resolveDownloadFilename(build);
    if (build.storageKind === "s3") {
      const bucket = process.env.SPACES_BUCKET;
      if (!bucket) {
        return reply.status(500).send({ error: "storage_not_configured" });
      }
      const signedUrl = await presignStorageObject({
        bucket,
        key: build.storagePath,
        expiresIn: INSTALL_TTL_SECONDS,
        responseContentDisposition: buildContentDisposition(filename),
      });
      return reply.redirect(signedUrl);
    }

    if (!fs.existsSync(build.storagePath)) {
      return reply.status(404).send({ error: "file_not_found" });
    }
    reply.header("Content-Type", "application/octet-stream");
    reply.header("Content-Disposition", buildContentDisposition(filename));
    return reply.send(fs.createReadStream(build.storagePath));
  });

  app.post("/builds/:id/ios/installs/track", async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(401).send({ error: "token_invalid" });
    }
    const payload = verifyInstallToken(token, "install");
    if (!payload) {
      return reply.status(401).send({ error: "token_invalid" });
    }

    const parsed = installEventSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    const build = await prisma.build.findFirst({
      where: { id: payload.buildId, version: { app: { teamId: payload.teamId } } },
      select: { id: true },
    });
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const created = await prisma.buildEvent.create({
      data: {
        buildId: payload.buildId,
        teamId: payload.teamId,
        userId: payload.userId,
        kind: BuildEventKind.install,
        platform: parsed.data.platform ?? PlatformKind.ios,
        targetId: parsed.data.targetId,
        deviceId: parsed.data.deviceId,
        metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
        ip: request.ip,
        userAgent: typeof request.headers["user-agent"] === "string"
          ? request.headers["user-agent"]
          : undefined,
      },
    });
    return reply.status(201).send(created);
  });
}

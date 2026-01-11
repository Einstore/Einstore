import { FastifyInstance } from "fastify";
import { z } from "zod";
import fs from "node:fs";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { generateInstallToken, verifyInstallToken } from "../lib/install-links.js";
import { presignStorageObject } from "../lib/storage-presign.js";
import { BuildEventKind, PlatformKind, Prisma } from "@prisma/client";

const INSTALL_TTL_SECONDS = 300;

const installEventSchema = z.object({
  platform: z.nativeEnum(PlatformKind).optional(),
  targetId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const resolveBaseUrl = (request: { headers: Record<string, string | string[] | undefined> }) => {
  const protoHeader = request.headers["x-forwarded-proto"];
  const hostHeader = request.headers["x-forwarded-host"] ?? request.headers["host"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) {
    return "http://localhost:8080";
  }
  return `${proto || "http"}://${host}`;
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
    `          <string>${payload.downloadUrl}</string>`,
    "        </dict>",
    "      </array>",
    "      <key>metadata</key>",
    "      <dict>",
    "        <key>bundle-identifier</key>",
    `        <string>${payload.bundleId}</string>`,
    "        <key>bundle-version</key>",
    `        <string>${payload.version}</string>`,
    "        <key>kind</key>",
    "        <string>software</string>",
    "        <key>title</key>",
    `        <string>${payload.title}</string>`,
    "        <key>build-number</key>",
    `        <string>${payload.buildNumber}</string>`,
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

    if (build.storageKind === "s3") {
      const bucket = process.env.SPACES_BUCKET;
      if (!bucket) {
        return reply.status(500).send({ error: "storage_not_configured" });
      }
      const signedUrl = await presignStorageObject({
        bucket,
        key: build.storagePath,
        expiresIn: INSTALL_TTL_SECONDS,
      });
      return reply.redirect(signedUrl);
    }

    if (!fs.existsSync(build.storagePath)) {
      return reply.status(404).send({ error: "file_not_found" });
    }
    reply.header("Content-Type", "application/octet-stream");
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

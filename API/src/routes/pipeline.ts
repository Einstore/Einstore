import { FastifyInstance } from "fastify";
import { z } from "zod";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ingestAndroidApk } from "../lib/ingest/android.js";
import { ingestIosIpa } from "../lib/ingest/ios.js";
import { ensureZipReadable, isInvalidArchiveError } from "../lib/zip.js";
import { requireTeamOrApiKey } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { prisma } from "../lib/prisma.js";
import { resolveS3Client, presignPutObject } from "../lib/storage-presign.js";

const ingestSchema = z.object({
  buildId: z.string().uuid().optional(),
  filePath: z.string().min(1),
  kind: z.enum(["ipa", "apk", "aab"]),
});

type IngestRequest = z.infer<typeof ingestSchema>;
const allowedUploadExtensions = new Set([".apk", ".ipa"]);
const STORAGE_LIMIT_SETTING_KEY = "storage.defaultLimitGb";
const ONE_GB_BYTES = 1024n * 1024n * 1024n;
const PRESIGNED_TTL_SECONDS = 900;
const presignUploadSchema = z.object({
  filename: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  contentType: z.string().optional(),
  signContentType: z.coerce.boolean().optional(),
});
const completeUploadSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1).optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
});

const parseContentLength = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric > 0 ? BigInt(Math.ceil(numeric)) : null;
};

const gbToBytes = (gb: number) => BigInt(Math.round(gb * 1024 * 1024 * 1024));

const resolveStorageLimitBytes = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { storageLimitBytes: true },
  });
  if (team?.storageLimitBytes) {
    return BigInt(team.storageLimitBytes);
  }
  const setting = await prisma.siteSetting.findUnique({
    where: { key: STORAGE_LIMIT_SETTING_KEY },
  });
  const defaultLimitGb =
    typeof (setting?.value as { defaultLimitGb?: unknown } | null)?.defaultLimitGb === "number"
      ? (setting?.value as { defaultLimitGb: number }).defaultLimitGb
      : 1;
  return defaultLimitGb > 0 ? gbToBytes(defaultLimitGb) : ONE_GB_BYTES;
};

const getTeamStorageUsage = async (teamId: string) => {
  const aggregate = await prisma.build.aggregate({
    _sum: { sizeBytes: true },
    where: { version: { app: { teamId } } },
  });
  return BigInt(aggregate._sum.sizeBytes ?? 0);
};

const ensureStorageCapacity = async (teamId: string, requiredBytes: bigint) => {
  const limitBytes = await resolveStorageLimitBytes(teamId);
  const usedBytes = await getTeamStorageUsage(teamId);
  if (usedBytes + requiredBytes <= limitBytes) {
    return;
  }

  const neededFree = usedBytes + requiredBytes - limitBytes;
  const builds = await prisma.build.findMany({
    where: { version: { app: { teamId } } },
    select: {
      id: true,
      sizeBytes: true,
      storageKind: true,
      storagePath: true,
      createdAt: true,
      version: { select: { appId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const counts = builds.reduce<Map<string, number>>((map, build) => {
    const appId = build.version.appId;
    map.set(appId, (map.get(appId) ?? 0) + 1);
    return map;
  }, new Map());

  let freed = 0n;
  const deletable: typeof builds = [];
  for (const build of builds) {
    const appId = build.version.appId;
    const appCount = counts.get(appId) ?? 0;
    if (appCount <= 1) {
      continue;
    }
    deletable.push(build);
    counts.set(appId, appCount - 1);
    freed += BigInt(build.sizeBytes);
    if (freed >= neededFree) {
      break;
    }
  }

  if (freed < neededFree) {
    const singleBuildApps = Array.from(counts.values()).every((count) => count <= 1);
    const message = singleBuildApps
      ? "Storage limit reached and each app only has one build. Increase storage or delete a build manually."
      : "Storage limit reached. Delete older builds or increase storage.";
    const err: Error & { statusCode?: number; code?: string } = new Error(message);
    err.statusCode = 413;
    err.code = "storage_limit_exceeded";
    throw err;
  }

  const idsToDelete = deletable.map((build) => build.id);
  await prisma.build.deleteMany({ where: { id: { in: idsToDelete } } });

  await Promise.all(
    deletable
      .filter((build) => build.storageKind === "local")
      .map((build) => fs.promises.rm(build.storagePath, { force: true }).catch(() => undefined))
  );
};

const resolveSpacesConfig = () => {
  const client = resolveS3Client();
  const bucket = process.env.SPACES_BUCKET;
  if (!client || !bucket) return null;
  return { client, bucket };
};

const headSpacesObject = async (bucket: string, key: string) => {
  const spaces = resolveSpacesConfig();
  if (!spaces) return null;
  const response = await spaces.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    size: typeof response.ContentLength === "number" ? BigInt(response.ContentLength) : null,
    contentType: response.ContentType ?? null,
  };
};

const downloadSpacesObject = async (bucket: string, key: string, extension: string) => {
  const spaces = resolveSpacesConfig();
  if (!spaces) {
    throw new Error("Spaces not configured");
  }
  const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${crypto.randomUUID()}${extension}`);
  const object = await spaces.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) {
    throw new Error("Empty object");
  }
  await pipeline(object.Body as NodeJS.ReadableStream, fs.createWriteStream(filePath));
  const stats = await fs.promises.stat(filePath);
  return { filePath, sizeBytes: BigInt(stats.size) };
};

const deleteSpacesObject = async (bucket: string, key: string) => {
  const spaces = resolveSpacesConfig();
  if (!spaces) return;
  await spaces.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
};

export async function pipelineRoutes(app: FastifyInstance) {
  app.post("/ingest/upload-url", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
    const parsed = presignUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const spaces = resolveSpacesConfig();
    if (!spaces) {
      return reply.status(500).send({ error: "storage_not_configured" });
    }
    const extension = path.extname(parsed.data.filename).toLowerCase();
    if (!allowedUploadExtensions.has(extension)) {
      return reply.status(400).send({ error: "unsupported_file_type" });
    }
    const sizeBytes = BigInt(parsed.data.sizeBytes);
    try {
      await ensureStorageCapacity(teamId, sizeBytes);
    } catch (error) {
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }
    const key = `ingest/${teamId}/${crypto.randomUUID()}${extension}`;
    const shouldSignContentType = Boolean(parsed.data.signContentType && parsed.data.contentType);
    const uploadUrl = await presignPutObject({
      bucket: spaces.bucket,
      key,
      expiresIn: PRESIGNED_TTL_SECONDS,
      ...(shouldSignContentType ? { contentType: parsed.data.contentType } : {}),
    });
    return reply.send({
      uploadUrl,
      key,
      expiresIn: PRESIGNED_TTL_SECONDS,
      headers: shouldSignContentType ? { "Content-Type": parsed.data.contentType ?? "" } : {},
    });
  });

  app.post("/ingest/complete-upload", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
    const parsed = completeUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const spaces = resolveSpacesConfig();
    if (!spaces) {
      return reply.status(500).send({ error: "storage_not_configured" });
    }
    const extension = path.extname(parsed.data.filename ?? parsed.data.key).toLowerCase();
    if (!allowedUploadExtensions.has(extension)) {
      return reply.status(400).send({ error: "unsupported_file_type" });
    }
    const head = await headSpacesObject(spaces.bucket, parsed.data.key);
    const expectedSize = head?.size ?? (parsed.data.sizeBytes ? BigInt(parsed.data.sizeBytes) : null);
    if (!expectedSize || expectedSize <= 0) {
      return reply.status(411).send({ error: "content_length_required" });
    }
    try {
      await ensureStorageCapacity(teamId, expectedSize);
    } catch (error) {
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }

    let filePath: string | null = null;
    try {
      const download = await downloadSpacesObject(spaces.bucket, parsed.data.key, extension);
      filePath = download.filePath;
      try {
        await ensureStorageCapacity(teamId, download.sizeBytes);
      } catch (error) {
        await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
        if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
          return reply
            .status((error as { statusCode?: number }).statusCode ?? 413)
            .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
        }
        throw error;
      }
      const userId = request.auth?.user.id;
      try {
        await ensureZipReadable(filePath);
      } catch (error) {
        if (isInvalidArchiveError(error)) {
          await fs.promises.rm(filePath, { force: true });
          return reply.status(400).send({ error: "invalid_archive" });
        }
        throw error;
      }
      if (extension === ".apk") {
        const result = await ingestAndroidApk(filePath, teamId, userId);
        await deleteSpacesObject(spaces.bucket, parsed.data.key);
        await broadcastBadgesUpdate(teamId).catch(() => undefined);
        return reply.status(201).send({ status: "ingested", result });
      }
      const result = await ingestIosIpa(filePath, teamId, userId);
      await deleteSpacesObject(spaces.bucket, parsed.data.key);
      await broadcastBadgesUpdate(teamId).catch(() => undefined);
      return reply.status(201).send({ status: "ingested", result });
    } catch (error) {
      if (filePath) {
        await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
      }
      if (isInvalidArchiveError(error)) {
        return reply.status(400).send({ error: "invalid_archive" });
      }
      throw error;
    }
  });

  app.post("/ingest", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
    const parsed = ingestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const payload: IngestRequest = parsed.data;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const userId = request.auth?.user.id;
    if (payload.kind === "apk") {
      try {
        await ensureZipReadable(payload.filePath);
      } catch (error) {
        if (isInvalidArchiveError(error)) {
          return reply.status(400).send({ error: "invalid_archive" });
        }
        throw error;
      }
      const result = await ingestAndroidApk(payload.filePath, teamId, userId);
      await broadcastBadgesUpdate(teamId).catch(() => undefined);
      return reply.status(201).send({ status: "ingested", result });
    }

    if (payload.kind === "ipa") {
      try {
        await ensureZipReadable(payload.filePath);
      } catch (error) {
        if (isInvalidArchiveError(error)) {
          return reply.status(400).send({ error: "invalid_archive" });
        }
        throw error;
      }
      const result = await ingestIosIpa(payload.filePath, teamId, userId);
      await broadcastBadgesUpdate(teamId).catch(() => undefined);
      return reply.status(201).send({ status: "ingested", result });
    }

    return reply.status(501).send({
      status: "not-implemented",
      payload,
    });
  });

  app.post("/ingest/upload", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.status(400).send({ error: "multipart_required" });
    }
    const contentLength = parseContentLength(request.headers["content-length"]);
    const part = await request.file();
    if (!part) {
      return reply.status(400).send({ error: "missing_file" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    try {
      if (contentLength) {
        await ensureStorageCapacity(teamId, contentLength);
      }
    } catch (error) {
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }

    const extension = path.extname(part.filename ?? "").toLowerCase();
    if (!allowedUploadExtensions.has(extension)) {
      return reply.status(400).send({ error: "unsupported_file_type" });
    }

    const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const uploadName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, uploadName);
    let uploadedBytes: bigint | null = null;

    try {
      await pipeline(part.file, fs.createWriteStream(filePath));
      const stats = await fs.promises.stat(filePath);
      uploadedBytes = BigInt(stats.size);
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      throw error;
    }

    if (part.file.truncated) {
      await fs.promises.rm(filePath, { force: true });
      return reply.status(413).send({ error: "file_too_large" });
    }

    try {
      await ensureStorageCapacity(teamId, uploadedBytes ?? contentLength ?? 0n);
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }

    const userId = request.auth?.user.id;
    try {
      await ensureZipReadable(filePath);
    } catch (error) {
      if (isInvalidArchiveError(error)) {
        await fs.promises.rm(filePath, { force: true });
        return reply.status(400).send({ error: "invalid_archive" });
      }
      throw error;
    }
    try {
      if (extension === ".apk") {
        const result = await ingestAndroidApk(filePath, teamId, userId);
        await broadcastBadgesUpdate(teamId).catch(() => undefined);
        return reply.status(201).send({ status: "ingested", result });
      }

      const result = await ingestIosIpa(filePath, teamId, userId);
      await broadcastBadgesUpdate(teamId).catch(() => undefined);
      return reply.status(201).send({ status: "ingested", result });
    } catch (error) {
      if (isInvalidArchiveError(error)) {
        return reply.status(400).send({ error: "invalid_archive" });
      }
      throw error;
    }
  });

  app.post("/store/upload", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.status(400).send({ error: "multipart_required" });
    }
    const contentLength = parseContentLength(request.headers["content-length"]);
    const part = await request.file();
    if (!part) {
      return reply.status(400).send({ error: "missing_file" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    try {
      if (contentLength) {
        await ensureStorageCapacity(teamId, contentLength);
      }
    } catch (error) {
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }

    const extension = path.extname(part.filename ?? "").toLowerCase();
    const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const uploadName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, uploadName);
    let uploadedBytes: bigint | null = null;

    try {
      await pipeline(part.file, fs.createWriteStream(filePath));
      const stats = await fs.promises.stat(filePath);
      uploadedBytes = BigInt(stats.size);
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      throw error;
    }

    if (part.file.truncated) {
      await fs.promises.rm(filePath, { force: true });
      return reply.status(413).send({ error: "file_too_large" });
    }

    try {
      await ensureStorageCapacity(teamId, uploadedBytes ?? contentLength ?? 0n);
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({ error: "storage_limit_exceeded", message: (error as { message?: string }).message });
      }
      throw error;
    }

    const stats = await fs.promises.stat(filePath);
    return reply.status(201).send({
      status: "stored",
      filePath,
      filename: part.filename ?? uploadName,
      sizeBytes: stats.size,
      teamId,
    });
  });
}

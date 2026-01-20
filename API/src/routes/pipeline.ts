import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@prisma/client";
import { ingestAndroidFromFunction, ingestIosFromFunction } from "../lib/ingest/remote.js";
import { isInvalidArchiveError } from "../lib/zip.js";
import { requireTeam, requireTeamOrApiKey } from "../auth/guard.js";
import { broadcastBadgesUpdate, broadcastTeamEvent } from "../lib/realtime.js";
import { prisma } from "../lib/prisma.js";
import { resolveS3Client, presignPutObject } from "../lib/storage-presign.js";
import { resolveStorageLimitOverrideBytes } from "../lib/limit-overrides.js";
import { failStaleIngestJobs } from "../lib/ingest-timeout-cleanup.js";

type BillingGuard = {
  assertCanUploadBytes?: (payload: { teamId: string; requiredBytes: bigint | number }) => Promise<void>;
  assertCanCreateApp?: (payload: { teamId: string; userId?: string; identifier?: string }) => Promise<void>;
  assertCanCreateBuild?: (payload: { teamId: string; appId: string }) => Promise<void>;
};

const allowedUploadExtensions = new Set([".apk", ".ipa"]);
const STORAGE_LIMIT_SETTING_KEY = "storage.defaultLimitGb";
const ONE_GB_BYTES = 1024n * 1024n * 1024n;
const PRESIGNED_TTL_SECONDS = 900;
const presignUploadSchema = z.object({
  filename: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  contentType: z.string().optional(),
});
const completeUploadSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1).optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
});

const execFileAsync = promisify(execFile);
const ingestFunctionBaseSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
}).passthrough();
const ingestFunctionAndroidSchema = z.object({
  ok: z.literal(true),
  packageName: z.string().min(1),
  versionName: z.string().min(1),
  versionCode: z.string().min(1),
  permissions: z.array(z.string()),
}).passthrough();
const ingestFunctionIosSchema = z.object({
  ok: z.literal(true),
  appName: z.string().min(1),
  identifier: z.string().min(1),
  version: z.string().min(1),
  buildNumber: z.string().min(1),
  targets: z.array(z.any()),
  entitlements: z.any().optional(),
}).passthrough();
const ingestCallbackSchema = z.object({
  token: z.string().min(1),
  result: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

const isMacSafariUserAgent = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return false;
  const isMac = raw.includes("Macintosh");
  const isSafari = raw.includes("Safari") && !raw.includes("Chrome") && !raw.includes("Chromium");
  const isIOS = /iPad|iPhone|iPod/.test(raw);
  const isEdgeOrOpera = raw.includes("Edg") || raw.includes("OPR");
  return isMac && isSafari && !isIOS && !isEdgeOrOpera;
};

const gbToBytes = (gb: number) => BigInt(Math.round(gb * 1024 * 1024 * 1024));
const formatBytes = (value: bigint) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return `${value.toString()} B`;
  }
  let size = Number(value);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const resolveStorageLimitBytes = async (teamId: string) => {
  const overrideBytes = await resolveStorageLimitOverrideBytes(teamId);
  if (overrideBytes !== null) {
    return overrideBytes;
  }
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { storageLimitBytes: true },
  });
  if (team?.storageLimitBytes !== null && team?.storageLimitBytes !== undefined) {
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
    const availableBytes = limitBytes > usedBytes ? limitBytes - usedBytes : 0n;
    const err: Error & { statusCode?: number; code?: string } = new Error(message);
    err.statusCode = 413;
    err.code = "storage_limit_exceeded";
    (err as Error & { details?: Record<string, string> }).details = {
      limitBytes: limitBytes.toString(),
      usedBytes: usedBytes.toString(),
      requiredBytes: requiredBytes.toString(),
      availableBytes: availableBytes.toString(),
    };
    err.message = `${message} Used ${formatBytes(usedBytes)} of ${formatBytes(limitBytes)}; upload size ${formatBytes(requiredBytes)}.`;
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

const sendBillingError = (reply: FastifyReply, error: unknown) => {
  if (!error || typeof error !== "object" || !(error as { code?: string }).code) {
    throw error;
  }
  const candidate = (error as { statusCode?: number }).statusCode;
  const statusCode = typeof candidate === "number" ? candidate : 403;
  const details = (error as { details?: unknown }).details;
  return reply.status(statusCode).send({
    error: (error as { code: string }).code,
    message: (error as { message?: string }).message ?? "Plan limit reached.",
    ...(details && typeof details === "object" ? { details } : {}),
  });
};

const resolveSpacesConfig = () => {
  const client = resolveS3Client();
  const bucket = process.env.SPACES_BUCKET || (process.env.NODE_ENV === "production" ? undefined : "einstore-local");
  if (!client || !bucket) return null;
  return { client, bucket };
};

const resolveIngestFunctionUrl = () => {
  const raw = process.env.INGEST_FUNCTION_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    const trimmed = raw.trim();
    if (trimmed.endsWith(".json")) {
      return trimmed;
    }
    return `${trimmed.replace(/\/+$/, "")}.json`;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:7071";
  }
  return null;
};

const resolveLocalIngestWorkers = () => {
  const raw = process.env.LOCAL_INGEST_WORKERS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed)) {
    return Math.min(Math.max(parsed, 1), 20);
  }
  return 10;
};

const isLocalIngestUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const buildHealthUrl = (url: string) => `${url.replace(/\/+$/, "")}/health`;

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let localIngestBoot: Promise<boolean> | null = null;

const ensureLocalIngestRunning = async (url: string) => {
  if (process.env.NODE_ENV === "production") return true;
  if (!isLocalIngestUrl(url)) return true;
  if (localIngestBoot) return localIngestBoot;

  localIngestBoot = (async () => {
    const composePath = path.resolve(process.cwd(), "..", "functions", "ingest", "docker-compose.yml");
    const workers = resolveLocalIngestWorkers();
    await execFileAsync(
      "docker",
      ["compose", "-f", composePath, "up", "--build", "-d", "--scale", `ingest-function=${workers}`],
      { cwd: path.dirname(composePath) },
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const health = await fetchWithTimeout(buildHealthUrl(url), 1500);
        if (health.ok) return true;
      } catch {
        // ignore
      }
      await sleep(1000);
    }
    return false;
  })().finally(() => {
    localIngestBoot = null;
  });

  return localIngestBoot;
};

const callIngestFunctionAsync = async (url: string, payload: Record<string, unknown>) => {
  const target = new URL(url);
  target.searchParams.set("blocking", "false");
  target.searchParams.set("result", "false");
  const response = await fetch(target.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`ingest_function_failed: ${response.status} ${message}`);
  }
};

const hashIngestToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const tokensMatch = (token: string, storedHash: string) => {
  try {
    const tokenHash = hashIngestToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
};

const resolveCallbackBaseUrl = (request: { headers: Record<string, string | string[] | undefined> }) => {
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost ?? request.headers.host;
  if (!host || typeof host !== "string") {
    return null;
  }
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto ?? "http";
  return `${proto}://${host}`;
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

const deleteSpacesObject = async (bucket: string, key: string) => {
  const spaces = resolveSpacesConfig();
  if (!spaces) return;
  await spaces.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
};

export async function pipelineRoutes(app: FastifyInstance) {
  const billingGuard = (app as { billingGuard?: BillingGuard }).billingGuard;

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
      if (billingGuard?.assertCanUploadBytes) {
        await billingGuard.assertCanUploadBytes({ teamId, requiredBytes: sizeBytes });
      }
      await ensureStorageCapacity(teamId, sizeBytes);
    } catch (error) {
      if ((error as { code?: string }).code && (error as { code?: string }).code !== "storage_limit_exceeded") {
        return sendBillingError(reply, error);
      }
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        const details = (error as { details?: unknown }).details;
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({
            error: "storage_limit_exceeded",
            message: (error as { message?: string }).message,
            ...(details && typeof details === "object" ? { details } : {}),
          });
      }
      throw error;
    }
    const key = `ingest/${teamId}/${crypto.randomUUID()}${extension}`;
    const shouldSignContentType = Boolean(
      parsed.data.contentType && isMacSafariUserAgent(request.headers["user-agent"])
    );
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
      if (billingGuard?.assertCanUploadBytes) {
        await billingGuard.assertCanUploadBytes({ teamId, requiredBytes: expectedSize });
      }
      await ensureStorageCapacity(teamId, expectedSize);
    } catch (error) {
      if ((error as { code?: string }).code && (error as { code?: string }).code !== "storage_limit_exceeded") {
        return sendBillingError(reply, error);
      }
      if ((error as { code?: string; statusCode?: number; message?: string }).code === "storage_limit_exceeded") {
        const details = (error as { details?: unknown }).details;
        return reply
          .status((error as { statusCode?: number }).statusCode ?? 413)
          .send({
            error: "storage_limit_exceeded",
            message: (error as { message?: string }).message,
            ...(details && typeof details === "object" ? { details } : {}),
          });
      }
      throw error;
    }

    const ingestFunctionUrl = resolveIngestFunctionUrl();
    if (!ingestFunctionUrl) {
      return reply.status(500).send({
        error: "ingest_function_missing",
        message: "Ingest function URL is not configured.",
      });
    }
    const localReady = await ensureLocalIngestRunning(ingestFunctionUrl);
    if (!localReady) {
      return reply.status(503).send({
        error: "ingest_function_unavailable",
        message: "Local ingest function is unavailable.",
      });
    }
    const userId = request.auth?.user.id;
    const sizeBytes = Number(expectedSize);
    const kind = extension === ".apk" ? "apk" : "ipa";
    const callbackBaseUrl = resolveCallbackBaseUrl(request);
    if (!callbackBaseUrl) {
      return reply.status(500).send({
        error: "callback_url_missing",
        message: "Unable to resolve public callback URL.",
      });
    }
    const callbackToken = crypto.randomBytes(32).toString("hex");
    const ingestJob = await prisma.ingestJob.create({
      data: {
        teamId,
        createdByUserId: userId,
        status: "queued",
        kind,
        storageKey: parsed.data.key,
        filename: parsed.data.filename,
        sizeBytes: expectedSize,
        callbackTokenHash: hashIngestToken(callbackToken),
      },
    });
    const callbackUrl = new URL(`/ingest/jobs/${ingestJob.id}/callback`, callbackBaseUrl).toString();
    const storagePath = `spaces://${spaces.bucket}/${parsed.data.key}`;

    try {
      await prisma.ingestJob.update({
        where: { id: ingestJob.id },
        data: { status: "processing" },
      });
      const invokePromise = callIngestFunctionAsync(ingestFunctionUrl, {
        kind,
        storagePath,
        callbackUrl,
        callbackToken,
        jobId: ingestJob.id,
      });
      void invokePromise.catch(async (error) => {
        const message = error instanceof Error ? error.message : "Ingest function failed.";
        await prisma.ingestJob.update({
          where: { id: ingestJob.id },
          data: { status: "failed", errorMessage: message },
        });
        broadcastTeamEvent(teamId, { type: "ingest.failed", jobId: ingestJob.id, message });
      });
      return reply.status(202).send({ status: "processing", jobId: ingestJob.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ingest function failed.";
      await prisma.ingestJob.update({
        where: { id: ingestJob.id },
        data: { status: "failed", errorMessage: message },
      });
      return reply.status(502).send({
        error: "ingest_function_failed",
        message,
      });
    }
  });

  app.post("/ingest/jobs/:jobId/callback", async (request, reply) => {
    const parsed = ingestCallbackSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) {
      return reply.status(400).send({ error: "invalid_job" });
    }
    const job = await prisma.ingestJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return reply.status(404).send({ error: "job_not_found" });
    }
    if (!tokensMatch(parsed.data.token, job.callbackTokenHash)) {
      return reply.status(403).send({ error: "invalid_token" });
    }
    if (job.status === "completed" || job.status === "failed") {
      return reply.send({ status: job.status });
    }

    const recordFailure = async (message: string, result?: unknown) => {
      await prisma.ingestJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage: message,
          result: result ? (result as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
      broadcastTeamEvent(job.teamId, { type: "ingest.failed", jobId: job.id, message });
      return reply.send({ status: "failed" });
    };

    if (parsed.data.error || parsed.data.message) {
      const message = parsed.data.error || parsed.data.message || "Ingest function failed.";
      return recordFailure(message);
    }

    const functionResult = parsed.data.result;
    if (!functionResult) {
      return recordFailure("Ingest function returned no payload.");
    }
    const baseParsed = ingestFunctionBaseSchema.safeParse(functionResult);
    if (!baseParsed.success) {
      return recordFailure("Ingest function returned an invalid payload.", functionResult);
    }
    if (!baseParsed.data.ok) {
      return recordFailure(
        baseParsed.data.error || baseParsed.data.message || "Ingest function failed.",
        functionResult,
      );
    }

    try {
      const sizeBytes = Number(job.sizeBytes);
      if (job.kind !== "apk" && job.kind !== "ipa") {
        return recordFailure(`Unsupported ingest kind ${job.kind}.`);
      }
      if (job.kind === "apk") {
        const parsedPayload = ingestFunctionAndroidSchema.safeParse(functionResult);
        if (!parsedPayload.success) {
          return recordFailure("Ingest function returned an invalid Android payload.", functionResult);
        }
        const result = await ingestAndroidFromFunction(
          parsedPayload.data,
          job.storageKey,
          sizeBytes,
          job.teamId,
          job.createdByUserId ?? undefined,
          { billingGuard },
        );
        await prisma.ingestJob.update({
          where: { id: job.id },
          data: { status: "completed", result: result as Prisma.InputJsonValue },
        });
        await broadcastBadgesUpdate(job.teamId).catch(() => undefined);
        broadcastTeamEvent(job.teamId, { type: "ingest.completed", jobId: job.id, result });
        return reply.send({ status: "completed", result });
      }

      const parsedPayload = ingestFunctionIosSchema.safeParse(functionResult);
      if (!parsedPayload.success) {
        return recordFailure("Ingest function returned an invalid iOS payload.", functionResult);
      }
      const result = await ingestIosFromFunction(
        parsedPayload.data,
        job.storageKey,
        sizeBytes,
        job.teamId,
        job.createdByUserId ?? undefined,
        { billingGuard },
      );
      await prisma.ingestJob.update({
        where: { id: job.id },
        data: { status: "completed", result: result as Prisma.InputJsonValue },
      });
      await broadcastBadgesUpdate(job.teamId).catch(() => undefined);
      broadcastTeamEvent(job.teamId, { type: "ingest.completed", jobId: job.id, result });
      return reply.send({ status: "completed", result });
    } catch (error) {
      if (isInvalidArchiveError(error)) {
        return recordFailure("invalid_archive");
      }
      const message = error instanceof Error ? error.message : "Ingest failed.";
      return recordFailure(message);
    }
  });

  app.get("/ingest/processing-count", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    await failStaleIngestJobs({ teamId });
    const processingCount = await prisma.ingestJob.count({
      where: { teamId, status: { in: ["queued", "processing"] } },
    });
    return reply.send({ processingCount });
  });

}

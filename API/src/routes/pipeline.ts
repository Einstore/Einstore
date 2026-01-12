import { FastifyInstance } from "fastify";
import { z } from "zod";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ingestAndroidApk } from "../lib/ingest/android.js";
import { ingestIosIpa } from "../lib/ingest/ios.js";
import { ensureZipReadable, isInvalidArchiveError } from "../lib/zip.js";
import { requireTeamOrApiKey } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";

const ingestSchema = z.object({
  buildId: z.string().uuid().optional(),
  filePath: z.string().min(1),
  kind: z.enum(["ipa", "apk", "aab"]),
});

type IngestRequest = z.infer<typeof ingestSchema>;
const allowedUploadExtensions = new Set([".apk", ".ipa"]);

export async function pipelineRoutes(app: FastifyInstance) {
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
    const part = await request.file();
    if (!part) {
      return reply.status(400).send({ error: "missing_file" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const extension = path.extname(part.filename ?? "").toLowerCase();
    if (!allowedUploadExtensions.has(extension)) {
      return reply.status(400).send({ error: "unsupported_file_type" });
    }

    const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const uploadName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, uploadName);

    try {
      await pipeline(part.file, fs.createWriteStream(filePath));
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      throw error;
    }

    if (part.file.truncated) {
      await fs.promises.rm(filePath, { force: true });
      return reply.status(413).send({ error: "file_too_large" });
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
    const part = await request.file();
    if (!part) {
      return reply.status(400).send({ error: "missing_file" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const extension = path.extname(part.filename ?? "").toLowerCase();
    const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const uploadName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, uploadName);

    try {
      await pipeline(part.file, fs.createWriteStream(filePath));
    } catch (error) {
      await fs.promises.rm(filePath, { force: true });
      throw error;
    }

    if (part.file.truncated) {
      await fs.promises.rm(filePath, { force: true });
      return reply.status(413).send({ error: "file_too_large" });
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

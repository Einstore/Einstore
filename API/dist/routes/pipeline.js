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
import { prisma } from "../lib/prisma.js";
const ingestSchema = z.object({
    buildId: z.string().uuid().optional(),
    filePath: z.string().min(1),
    kind: z.enum(["ipa", "apk", "aab"]),
});
const allowedUploadExtensions = new Set([".apk", ".ipa"]);
const STORAGE_LIMIT_SETTING_KEY = "storage.defaultLimitGb";
const ONE_GB_BYTES = 1024n * 1024n * 1024n;
const parseContentLength = (value) => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string")
        return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? BigInt(Math.ceil(numeric)) : null;
};
const gbToBytes = (gb) => BigInt(Math.round(gb * 1024 * 1024 * 1024));
const resolveStorageLimitBytes = async (teamId) => {
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
    const defaultLimitGb = typeof setting?.value?.defaultLimitGb === "number"
        ? (setting?.value).defaultLimitGb
        : 1;
    return defaultLimitGb > 0 ? gbToBytes(defaultLimitGb) : ONE_GB_BYTES;
};
const getTeamStorageUsage = async (teamId) => {
    const aggregate = await prisma.build.aggregate({
        _sum: { sizeBytes: true },
        where: { version: { app: { teamId } } },
    });
    return BigInt(aggregate._sum.sizeBytes ?? 0);
};
const ensureStorageCapacity = async (teamId, requiredBytes) => {
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
    const counts = builds.reduce((map, build) => {
        const appId = build.version.appId;
        map.set(appId, (map.get(appId) ?? 0) + 1);
        return map;
    }, new Map());
    let freed = 0n;
    const deletable = [];
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
        const err = new Error(message);
        err.statusCode = 413;
        err.code = "storage_limit_exceeded";
        throw err;
    }
    const idsToDelete = deletable.map((build) => build.id);
    await prisma.build.deleteMany({ where: { id: { in: idsToDelete } } });
    await Promise.all(deletable
        .filter((build) => build.storageKind === "local")
        .map((build) => fs.promises.rm(build.storagePath, { force: true }).catch(() => undefined)));
};
export async function pipelineRoutes(app) {
    app.post("/ingest", { preHandler: requireTeamOrApiKey }, async (request, reply) => {
        const parsed = ingestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const payload = parsed.data;
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const userId = request.auth?.user.id;
        if (payload.kind === "apk") {
            try {
                await ensureZipReadable(payload.filePath);
            }
            catch (error) {
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
            }
            catch (error) {
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
        }
        catch (error) {
            if (error.code === "storage_limit_exceeded") {
                return reply
                    .status(error.statusCode ?? 413)
                    .send({ error: "storage_limit_exceeded", message: error.message });
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
        let uploadedBytes = null;
        try {
            await pipeline(part.file, fs.createWriteStream(filePath));
            const stats = await fs.promises.stat(filePath);
            uploadedBytes = BigInt(stats.size);
        }
        catch (error) {
            await fs.promises.rm(filePath, { force: true });
            throw error;
        }
        if (part.file.truncated) {
            await fs.promises.rm(filePath, { force: true });
            return reply.status(413).send({ error: "file_too_large" });
        }
        try {
            await ensureStorageCapacity(teamId, uploadedBytes ?? contentLength ?? 0n);
        }
        catch (error) {
            await fs.promises.rm(filePath, { force: true });
            if (error.code === "storage_limit_exceeded") {
                return reply
                    .status(error.statusCode ?? 413)
                    .send({ error: "storage_limit_exceeded", message: error.message });
            }
            throw error;
        }
        const userId = request.auth?.user.id;
        try {
            await ensureZipReadable(filePath);
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            if (error.code === "storage_limit_exceeded") {
                return reply
                    .status(error.statusCode ?? 413)
                    .send({ error: "storage_limit_exceeded", message: error.message });
            }
            throw error;
        }
        const extension = path.extname(part.filename ?? "").toLowerCase();
        const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const uploadName = `${crypto.randomUUID()}${extension}`;
        const filePath = path.join(uploadDir, uploadName);
        let uploadedBytes = null;
        try {
            await pipeline(part.file, fs.createWriteStream(filePath));
            const stats = await fs.promises.stat(filePath);
            uploadedBytes = BigInt(stats.size);
        }
        catch (error) {
            await fs.promises.rm(filePath, { force: true });
            throw error;
        }
        if (part.file.truncated) {
            await fs.promises.rm(filePath, { force: true });
            return reply.status(413).send({ error: "file_too_large" });
        }
        try {
            await ensureStorageCapacity(teamId, uploadedBytes ?? contentLength ?? 0n);
        }
        catch (error) {
            await fs.promises.rm(filePath, { force: true });
            if (error.code === "storage_limit_exceeded") {
                return reply
                    .status(error.statusCode ?? 413)
                    .send({ error: "storage_limit_exceeded", message: error.message });
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

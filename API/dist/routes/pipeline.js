import { z } from "zod";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ingestAndroidApk } from "../lib/ingest/android.js";
import { ingestIosIpa } from "../lib/ingest/ios.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
const ingestSchema = z.object({
    buildId: z.string().uuid().optional(),
    filePath: z.string().min(1),
    kind: z.enum(["ipa", "apk", "aab"]),
});
const allowedUploadExtensions = new Set([".apk", ".ipa"]);
export async function pipelineRoutes(app) {
    app.post("/ingest", { preHandler: requireTeam }, async (request, reply) => {
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
            const result = await ingestAndroidApk(payload.filePath, teamId, userId);
            await broadcastBadgesUpdate(teamId).catch(() => undefined);
            return reply.status(201).send({ status: "ingested", result });
        }
        if (payload.kind === "ipa") {
            const result = await ingestIosIpa(payload.filePath, teamId, userId);
            await broadcastBadgesUpdate(teamId).catch(() => undefined);
            return reply.status(201).send({ status: "ingested", result });
        }
        return reply.status(501).send({
            status: "not-implemented",
            payload,
        });
    });
    app.post("/ingest/upload", { preHandler: requireTeam }, async (request, reply) => {
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
        }
        catch (error) {
            await fs.promises.rm(filePath, { force: true });
            throw error;
        }
        if (part.file.truncated) {
            await fs.promises.rm(filePath, { force: true });
            return reply.status(413).send({ error: "file_too_large" });
        }
        const userId = request.auth?.user.id;
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
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("end of central directory record signature not found")) {
                return reply.status(400).send({ error: "invalid_archive" });
            }
            throw error;
        }
    });
}

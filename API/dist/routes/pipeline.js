import { z } from "zod";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ingestAndroidApk } from "../lib/ingest/android.js";
import { ingestIosIpa } from "../lib/ingest/ios.js";
import { requireAuth } from "../auth/guard.js";
const ingestSchema = z.object({
    buildId: z.string().uuid().optional(),
    filePath: z.string().min(1),
    kind: z.enum(["ipa", "apk", "aab"]),
});
const allowedUploadExtensions = new Set([".apk", ".ipa"]);
export async function pipelineRoutes(app) {
    app.post("/ingest", { preHandler: requireAuth }, async (request, reply) => {
        const parsed = ingestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const payload = parsed.data;
        if (payload.kind === "apk") {
            const result = await ingestAndroidApk(payload.filePath);
            return reply.status(201).send({ status: "ingested", result });
        }
        if (payload.kind === "ipa") {
            const result = await ingestIosIpa(payload.filePath);
            return reply.status(201).send({ status: "ingested", result });
        }
        return reply.status(501).send({
            status: "not-implemented",
            payload,
        });
    });
    app.post("/ingest/upload", { preHandler: requireAuth }, async (request, reply) => {
        if (!request.isMultipart()) {
            return reply.status(400).send({ error: "multipart_required" });
        }
        const part = await request.file();
        if (!part) {
            return reply.status(400).send({ error: "missing_file" });
        }
        const extension = path.extname(part.filename ?? "").toLowerCase();
        if (!allowedUploadExtensions.has(extension)) {
            return reply.status(400).send({ error: "unsupported_file_type" });
        }
        const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const uploadName = `${crypto.randomUUID()}${extension}`;
        const filePath = path.join(uploadDir, uploadName);
        await pipeline(part.file, fs.createWriteStream(filePath));
        if (extension === ".apk") {
            const result = await ingestAndroidApk(filePath);
            return reply.status(201).send({ status: "ingested", result });
        }
        const result = await ingestIosIpa(filePath);
        return reply.status(201).send({ status: "ingested", result });
    });
}

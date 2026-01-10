import { z } from "zod";
import { ingestAndroidApk } from "../lib/ingest/android.js";
import { ingestIosIpa } from "../lib/ingest/ios.js";
const ingestSchema = z.object({
    buildId: z.string().uuid().optional(),
    filePath: z.string().min(1),
    kind: z.enum(["ipa", "apk", "aab"]),
});
export async function pipelineRoutes(app) {
    app.post("/ingest", async (request, reply) => {
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
}

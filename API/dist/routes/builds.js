import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";
const createBuildSchema = z.object({
    appIdentifier: z.string().min(1),
    appName: z.string().min(1),
    version: z.string().min(1),
    buildNumber: z.string().min(1),
    displayName: z.string().min(1),
    storageKind: z.enum(["local", "s3"]),
    storagePath: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
});
const listQuerySchema = z.object({
    appId: z.string().uuid().optional(),
    versionId: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
});
export async function buildRoutes(app) {
    app.post("/builds", { preHandler: requireAuth }, async (request, reply) => {
        const parsed = createBuildSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const input = parsed.data;
        const appRecord = await prisma.app.upsert({
            where: { identifier: input.appIdentifier },
            update: { name: input.appName },
            create: { identifier: input.appIdentifier, name: input.appName },
        });
        const versionRecord = await prisma.version.upsert({
            where: {
                appId_version: {
                    appId: appRecord.id,
                    version: input.version,
                },
            },
            update: {},
            create: {
                appId: appRecord.id,
                version: input.version,
            },
        });
        const build = await prisma.build.create({
            data: {
                versionId: versionRecord.id,
                buildNumber: input.buildNumber,
                displayName: input.displayName,
                storageKind: input.storageKind,
                storagePath: input.storagePath,
                sizeBytes: input.sizeBytes,
            },
        });
        return reply.status(201).send(build);
    });
    app.get("/builds", { preHandler: requireAuth }, async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const where = {};
        if (parsed.data.versionId) {
            where.versionId = parsed.data.versionId;
        }
        else if (parsed.data.appId) {
            const versions = await prisma.version.findMany({
                where: { appId: parsed.data.appId },
                select: { id: true },
            });
            const ids = versions.map((version) => version.id);
            const items = await prisma.build.findMany({
                where: { versionId: { in: ids } },
                skip: parsed.data.offset,
                take: parsed.data.limit,
                orderBy: { createdAt: "desc" },
            });
            return reply.send(items);
        }
        const items = await prisma.build.findMany({
            where,
            skip: parsed.data.offset,
            take: parsed.data.limit,
            orderBy: { createdAt: "desc" },
        });
        return reply.send(items);
    });
    app.get("/builds/:id", { preHandler: requireAuth }, async (request, reply) => {
        const id = request.params.id;
        const record = await prisma.build.findUnique({
            where: { id },
            include: { targets: true, variants: true, modules: true, artifacts: true, signing: true },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        return reply.send(record);
    });
}

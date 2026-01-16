import fs from "node:fs";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
import { resolveS3Client } from "../lib/storage-presign.js";
import { PlatformKind } from "@prisma/client";
const createAppSchema = z.object({
    name: z.string().min(1),
    identifier: z.string().min(1),
});
const listQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().positive().max(100).optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    platform: z.nativeEnum(PlatformKind).optional(),
});
const sendBillingError = (reply, error) => {
    if (!error || typeof error !== "object" || !error.code) {
        throw error;
    }
    const candidate = error.statusCode;
    const statusCode = typeof candidate === "number" ? candidate : 403;
    return reply.status(statusCode).send({
        error: error.code,
        message: error.message ?? "Plan limit reached.",
    });
};
const resolveStorageBucket = () => {
    if (process.env.SPACES_BUCKET) {
        return process.env.SPACES_BUCKET;
    }
    return process.env.NODE_ENV !== "production" ? "einstore-local" : null;
};
const parseSpacesPath = (value) => {
    if (!value.startsWith("spaces://"))
        return null;
    const stripped = value.replace("spaces://", "");
    const [bucket, ...rest] = stripped.split("/");
    if (!bucket || !rest.length)
        return null;
    return { bucket, key: rest.join("/") };
};
const resolveRemoteObject = (storagePath, fallbackBucket) => {
    const parsed = parseSpacesPath(storagePath);
    if (parsed)
        return parsed;
    if (!fallbackBucket)
        return null;
    if (storagePath.includes("://"))
        return null;
    const key = storagePath.replace(/^\/+/, "");
    if (!key)
        return null;
    return { bucket: fallbackBucket, key };
};
const extractIconPath = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return null;
    const iconBitmap = metadata.iconBitmap;
    if (!iconBitmap || typeof iconBitmap !== "object" || Array.isArray(iconBitmap))
        return null;
    const record = iconBitmap;
    return typeof record.path === "string" ? record.path : null;
};
export async function appRoutes(app) {
    const billingGuard = app.billingGuard;
    app.post("/apps", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = createAppSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        if (billingGuard?.assertCanCreateApp) {
            try {
                await billingGuard.assertCanCreateApp({
                    teamId,
                    userId: request.auth?.user?.id,
                    identifier: parsed.data.identifier,
                });
            }
            catch (error) {
                return sendBillingError(reply, error);
            }
        }
        const created = await prisma.app.create({ data: { ...parsed.data, teamId } });
        await broadcastBadgesUpdate(teamId).catch(() => undefined);
        return reply.status(201).send(created);
    });
    app.get("/apps", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const pagination = resolvePagination({
            page: parsed.data.page,
            perPage: parsed.data.perPage,
            limit: parsed.data.limit,
            offset: parsed.data.offset,
        });
        const where = parsed.data.platform
            ? {
                teamId,
                versions: {
                    some: {
                        builds: { some: { targets: { some: { platform: parsed.data.platform } } } },
                    },
                },
            }
            : { teamId };
        const [total, items] = await prisma.$transaction([
            prisma.app.count({ where }),
            prisma.app.findMany({
                where,
                skip: pagination.offset,
                take: pagination.perPage,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        const appIds = items.map((item) => item.id);
        const builds = appIds.length
            ? await prisma.build.findMany({
                where: { version: { appId: { in: appIds } } },
                select: {
                    createdAt: true,
                    version: { select: { appId: true } },
                    targets: { select: { platform: true, role: true } },
                },
                orderBy: { createdAt: "desc" },
            })
            : [];
        const buildList = Array.isArray(builds) ? builds : [];
        const appPlatformMap = new Map();
        for (const build of buildList) {
            const appId = build.version.appId;
            if (appPlatformMap.has(appId))
                continue;
            const target = build.targets.find((entry) => entry.role === "app") ?? build.targets[0];
            if (target?.platform) {
                appPlatformMap.set(appId, target.platform);
            }
        }
        const meta = buildPaginationMeta({
            page: pagination.page,
            perPage: pagination.perPage,
            total,
        });
        return reply.send({
            items: items.map((item) => ({
                ...item,
                platform: appPlatformMap.get(item.id) ?? null,
            })),
            ...meta,
        });
    });
    app.get("/apps/:id", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const record = await prisma.app.findFirst({
            where: { id, teamId },
            include: { versions: true },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        return reply.send(record);
    });
    app.delete("/apps/:id/builds", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const record = await prisma.app.findFirst({
            where: { id, teamId },
            select: { id: true },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        const builds = await prisma.build.findMany({
            where: { version: { appId: id } },
            select: { id: true, storageKind: true, storagePath: true },
        });
        if (!builds.length) {
            return reply.send({ deletedBuilds: 0 });
        }
        const buildIds = builds.map((build) => build.id);
        const artifacts = await prisma.complianceArtifact.findMany({
            where: { buildId: { in: buildIds } },
            select: { storageKind: true, storagePath: true },
        });
        const targetIds = await prisma.target.findMany({
            where: { buildId: { in: buildIds } },
            select: { id: true },
        });
        const targetIdList = targetIds.map((target) => target.id);
        const targets = await prisma.target.findMany({
            where: { id: { in: targetIdList } },
            select: { metadata: true },
        });
        const storageBucket = resolveStorageBucket();
        const remoteObjects = new Map();
        const addRemoteObject = (storagePath) => {
            const resolved = resolveRemoteObject(storagePath, storageBucket);
            if (!resolved)
                return;
            remoteObjects.set(`${resolved.bucket}/${resolved.key}`, resolved);
        };
        builds
            .filter((build) => build.storageKind === "s3")
            .forEach((build) => addRemoteObject(build.storagePath));
        artifacts
            .filter((artifact) => artifact.storageKind === "s3")
            .forEach((artifact) => addRemoteObject(artifact.storagePath));
        targets
            .map((target) => extractIconPath(target.metadata))
            .filter((iconPath) => Boolean(iconPath))
            .forEach((iconPath) => addRemoteObject(iconPath));
        const s3Client = remoteObjects.size ? resolveS3Client() : null;
        if (remoteObjects.size && !s3Client) {
            return reply.status(500).send({
                error: "storage_not_configured",
                message: "Storage credentials are not configured.",
            });
        }
        await prisma.$transaction([
            prisma.comment.deleteMany({
                where: { parentId: { in: buildIds }, category: "build" },
            }),
            prisma.buildEvent.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.trackingEvent.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.buildTag.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.capability.deleteMany({
                where: { targetId: { in: targetIdList } },
            }),
            prisma.target.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.variant.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.module.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.complianceArtifact.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.signingIdentity.deleteMany({
                where: { buildId: { in: buildIds } },
            }),
            prisma.build.deleteMany({
                where: { id: { in: buildIds } },
            }),
        ]);
        if (s3Client && remoteObjects.size) {
            await Promise.all(Array.from(remoteObjects.values()).map((item) => s3Client
                .send(new DeleteObjectCommand({
                Bucket: item.bucket,
                Key: item.key,
            }))
                .catch(() => undefined)));
        }
        await Promise.all([
            ...builds
                .filter((build) => build.storageKind === "local")
                .map((build) => build.storagePath),
            ...artifacts
                .filter((artifact) => artifact.storageKind === "local")
                .map((artifact) => artifact.storagePath),
        ].map((storagePath) => fs.promises.rm(storagePath, { force: true }).catch(() => undefined)));
        await broadcastBadgesUpdate(teamId).catch(() => undefined);
        return reply.send({ deletedBuilds: buildIds.length });
    });
}

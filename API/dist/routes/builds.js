import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireAppForTeam } from "../lib/team-access.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
const groupArtifactsByKind = (items) => {
    const grouped = {};
    for (const item of items) {
        const existing = grouped[item.kind] ?? [];
        existing.push(item);
        grouped[item.kind] = existing;
    }
    for (const list of Object.values(grouped)) {
        list.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    return grouped;
};
const storageRoot = path.resolve(process.cwd(), "storage", "ingest");
const resolveBaseUrl = (request) => {
    const protoHeader = request.headers["x-forwarded-proto"];
    const hostHeader = request.headers["x-forwarded-host"] ?? request.headers["host"];
    const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    if (!host) {
        return "http://localhost:8100";
    }
    return `${proto || "http"}://${host}`;
};
const resolveIconPath = (iconPath) => {
    const candidate = path.isAbsolute(iconPath) ? iconPath : path.join(storageRoot, iconPath);
    const resolved = path.resolve(candidate);
    const relative = path.relative(storageRoot, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return null;
    }
    return resolved;
};
const readIconDataUrl = async (filePath) => {
    const buffer = await fs.promises.readFile(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
};
const extractIconBitmap = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return null;
    const iconBitmap = metadata.iconBitmap;
    if (!iconBitmap || typeof iconBitmap !== "object" || Array.isArray(iconBitmap))
        return null;
    const record = iconBitmap;
    const iconPath = typeof record.path === "string" ? record.path : "";
    if (!iconPath)
        return null;
    return {
        path: iconPath,
        width: typeof record.width === "number" ? record.width : undefined,
        height: typeof record.height === "number" ? record.height : undefined,
        sizeBytes: typeof record.sizeBytes === "number" ? record.sizeBytes : undefined,
        sourcePath: typeof record.sourcePath === "string" ? record.sourcePath : undefined,
    };
};
const createBuildSchema = z.object({
    appIdentifier: z.string().min(1),
    appName: z.string().min(1),
    version: z.string().min(1),
    buildNumber: z.string().min(1),
    displayName: z.string().min(1),
    storageKind: z.enum(["local", "s3"]),
    storagePath: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    gitCommit: z.string().trim().max(200).optional().nullable(),
    prUrl: z.string().trim().url().max(2048).optional().nullable(),
    changeLog: z.string().trim().max(20000).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
    info: z.record(z.string(), z.unknown()).optional().nullable(),
});
const updateBuildSchema = z.object({
    gitCommit: z.string().trim().max(200).optional().nullable(),
    prUrl: z.string().trim().url().max(2048).optional().nullable(),
    changeLog: z.string().trim().max(20000).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
    info: z.record(z.string(), z.unknown()).optional().nullable(),
});
const listQuerySchema = z.object({
    appId: z.string().uuid().optional(),
    versionId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().positive().max(100).optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
});
const normalizeNullableString = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const trimmed = value.trim();
    return trimmed || null;
};
const normalizeBuildMetadata = (input) => ({
    gitCommit: normalizeNullableString(input.gitCommit ?? undefined),
    prUrl: normalizeNullableString(input.prUrl ?? undefined),
    changeLog: normalizeNullableString(input.changeLog ?? undefined),
    notes: normalizeNullableString(input.notes ?? undefined),
    info: input.info === undefined ? undefined : input.info ?? null,
});
const toBuildMetadataData = (metadata) => {
    const data = {};
    if (metadata.gitCommit !== undefined)
        data.gitCommit = metadata.gitCommit;
    if (metadata.prUrl !== undefined)
        data.prUrl = metadata.prUrl;
    if (metadata.changeLog !== undefined)
        data.changeLog = metadata.changeLog;
    if (metadata.notes !== undefined)
        data.notes = metadata.notes;
    if (metadata.info !== undefined)
        data.info = metadata.info;
    return data;
};
export async function buildRoutes(app) {
    app.post("/builds", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = createBuildSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const input = parsed.data;
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const appRecord = await prisma.app.upsert({
            where: { teamId_identifier: { teamId, identifier: input.appIdentifier } },
            update: { name: input.appName },
            create: { identifier: input.appIdentifier, name: input.appName, teamId },
        });
        const metadata = normalizeBuildMetadata(input);
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
                createdByUserId: request.auth?.user.id,
                ...toBuildMetadataData(metadata),
            },
        });
        await broadcastBadgesUpdate(teamId).catch(() => undefined);
        return reply.status(201).send(build);
    });
    app.get("/builds", { preHandler: requireTeam }, async (request, reply) => {
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
        const where = {
            version: { app: { teamId } },
        };
        if (parsed.data.versionId) {
            where.versionId = parsed.data.versionId;
        }
        else if (parsed.data.appId) {
            const appRecord = await requireAppForTeam(teamId, parsed.data.appId);
            if (!appRecord) {
                const meta = buildPaginationMeta({
                    page: pagination.page,
                    perPage: pagination.perPage,
                    total: 0,
                });
                return reply.send({ items: [], ...meta });
            }
            where.version = { appId: parsed.data.appId, app: { teamId } };
        }
        const [total, items] = await prisma.$transaction([
            prisma.build.count({ where }),
            prisma.build.findMany({
                where,
                skip: pagination.offset,
                take: pagination.perPage,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        const meta = buildPaginationMeta({
            page: pagination.page,
            perPage: pagination.perPage,
            total,
        });
        return reply.send({
            items,
            ...meta,
        });
    });
    app.get("/builds/:id", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const record = await prisma.build.findFirst({
            where: { id, version: { app: { teamId } } },
            include: { targets: true, variants: true, modules: true, artifacts: true, signing: true },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        return reply.send(record);
    });
    app.patch("/builds/:id", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = updateBuildSchema.safeParse(request.body ?? {});
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const existing = await prisma.build.findFirst({
            where: { id, version: { app: { teamId } } },
        });
        if (!existing) {
            return reply.status(404).send({ error: "Not found" });
        }
        const metadata = normalizeBuildMetadata(parsed.data);
        const updates = toBuildMetadataData(metadata);
        if (!Object.keys(updates).length) {
            return reply.send(existing);
        }
        const updated = await prisma.build.update({
            where: { id },
            data: updates,
            include: {
                version: { include: { app: true } },
                targets: true,
                artifacts: true,
                signing: true,
            },
        });
        const artifactsByKind = groupArtifactsByKind(updated.artifacts);
        return reply.send({ ...updated, artifactsByKind });
    });
    app.get("/builds/:id/metadata", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const record = await prisma.build.findFirst({
            where: { id, version: { app: { teamId } } },
            include: {
                version: { include: { app: true } },
                targets: true,
                artifacts: true,
                signing: true,
            },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        const artifactsByKind = groupArtifactsByKind(record.artifacts);
        return reply.send({ ...record, artifactsByKind });
    });
    app.get("/builds/:id/icons", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const record = await prisma.build.findFirst({
            where: { id, version: { app: { teamId } } },
            include: {
                version: { include: { app: true } },
                targets: true,
            },
        });
        if (!record) {
            return reply.status(404).send({ error: "Not found" });
        }
        const baseUrl = resolveBaseUrl(request);
        const items = (await Promise.all(record.targets.map(async (target) => {
            const iconBitmap = extractIconBitmap(target.metadata);
            if (!iconBitmap)
                return null;
            const resolved = resolveIconPath(iconBitmap.path);
            if (!resolved || !fs.existsSync(resolved))
                return null;
            return {
                targetId: target.id,
                bundleId: target.bundleId,
                platform: target.platform,
                role: target.role,
                iconBitmap: {
                    width: iconBitmap.width,
                    height: iconBitmap.height,
                    sizeBytes: iconBitmap.sizeBytes,
                    sourcePath: iconBitmap.sourcePath,
                },
                url: `${baseUrl}/builds/${record.id}/icons/${target.id}`,
                contentType: "image/png",
                dataUrl: await readIconDataUrl(resolved),
            };
        }))).filter((item) => Boolean(item));
        return reply.send({ buildId: record.id, items });
    });
    app.get("/builds/:id/icons/:targetId", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const params = request.params;
        const target = await prisma.target.findFirst({
            where: {
                id: params.targetId,
                buildId: params.id,
                build: { version: { app: { teamId } } },
            },
        });
        if (!target) {
            return reply.status(404).send({ error: "Not found" });
        }
        const iconBitmap = extractIconBitmap(target.metadata);
        if (!iconBitmap) {
            return reply.status(404).send({ error: "icon_not_found" });
        }
        const resolved = resolveIconPath(iconBitmap.path);
        if (!resolved || !fs.existsSync(resolved)) {
            return reply.status(404).send({ error: "icon_not_found" });
        }
        reply.type("image/png");
        return reply.send(fs.createReadStream(resolved));
    });
}

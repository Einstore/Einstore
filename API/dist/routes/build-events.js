import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";
import { BuildEventKind, PlatformKind } from "@prisma/client";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
const listQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().min(1).max(200).optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    kind: z.nativeEnum(BuildEventKind).optional(),
    kinds: z.string().optional(),
    buildId: z.string().min(1).optional(),
});
const createEventSchema = z.object({
    platform: z.nativeEnum(PlatformKind).optional(),
    targetId: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
    metadata: z.record(z.unknown()).optional(),
});
const buildEventPayload = (input, meta, kind) => ({
    buildId: meta.buildId,
    teamId: meta.teamId,
    userId: meta.userId,
    kind,
    platform: input.platform,
    targetId: input.targetId,
    deviceId: input.deviceId,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: input.metadata,
});
export async function buildEventRoutes(app) {
    const createHandler = (kind) => async (request, reply) => {
        const parsed = createEventSchema.safeParse(request.body ?? {});
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const buildId = request.params.id;
        const build = await requireBuildForTeam(teamId, buildId);
        if (!build) {
            return reply.status(404).send({ error: "Not found" });
        }
        const created = await prisma.buildEvent.create({
            data: buildEventPayload(parsed.data, {
                buildId,
                teamId,
                userId: request.auth?.user.id,
                ip: request.ip,
                userAgent: typeof request.headers["user-agent"] === "string"
                    ? request.headers["user-agent"]
                    : undefined,
            }, kind),
        });
        return reply.status(201).send(created);
    };
    const listHandler = (kind) => async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const buildId = request.params.id;
        const build = await requireBuildForTeam(teamId, buildId);
        if (!build) {
            return reply.status(404).send({ error: "Not found" });
        }
        const pagination = resolvePagination({
            page: parsed.data.page,
            perPage: parsed.data.perPage,
            limit: parsed.data.limit,
            offset: parsed.data.offset,
            defaultPerPage: 25,
            maxPerPage: 200,
        });
        const where = { buildId, teamId, kind };
        const [total, items] = await prisma.$transaction([
            prisma.buildEvent.count({ where }),
            prisma.buildEvent.findMany({
                where,
                skip: pagination.offset,
                take: pagination.perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, username: true, email: true, fullName: true },
                    },
                },
            }),
        ]);
        const meta = buildPaginationMeta({
            page: pagination.page,
            perPage: pagination.perPage,
            total,
        });
        return reply.send({ items, ...meta });
    };
    app.post("/builds/:id/downloads", { preHandler: requireTeam }, createHandler("download"));
    app.get("/builds/:id/downloads", { preHandler: requireTeam }, listHandler("download"));
    app.post("/builds/:id/installs", { preHandler: requireTeam }, createHandler("install"));
    app.get("/builds/:id/installs", { preHandler: requireTeam }, listHandler("install"));
    app.get("/builds/events", { preHandler: requireTeam }, async (request, reply) => {
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
            defaultPerPage: 25,
            maxPerPage: 200,
        });
        const kinds = parsed.data.kinds
            ?.split(",")
            .map((kind) => kind.trim())
            .filter(Boolean)
            .filter((value) => value === BuildEventKind.download || value === BuildEventKind.install) ??
            (parsed.data.kind ? [parsed.data.kind] : undefined);
        const where = {
            teamId,
            ...(parsed.data.buildId ? { buildId: parsed.data.buildId } : undefined),
            ...(kinds?.length ? { kind: { in: kinds } } : undefined),
        };
        const [total, items] = await prisma.$transaction([
            prisma.buildEvent.count({ where }),
            prisma.buildEvent.findMany({
                where,
                skip: pagination.offset,
                take: pagination.perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, username: true, email: true, fullName: true },
                    },
                    build: {
                        select: {
                            id: true,
                            buildNumber: true,
                            displayName: true,
                            version: {
                                select: {
                                    id: true,
                                    version: true,
                                    app: {
                                        select: { id: true, name: true, identifier: true },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const meta = buildPaginationMeta({
            page: pagination.page,
            perPage: pagination.perPage,
            total,
        });
        return reply.send({ items, ...meta });
    });
}

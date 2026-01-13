import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
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
}

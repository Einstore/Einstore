import { z } from "zod";
import { requireTeam } from "../auth/guard.js";
import { prisma } from "../lib/prisma.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
const listTagsQuery = z.object({
    appId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
});
export async function tagRoutes(app) {
    app.get("/tags", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = listTagsQuery.safeParse(request.query);
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
            maxPerPage: 100,
        });
        const where = parsed.data.appId
            ? {
                teamId,
                buildTags: { some: { build: { version: { app: { id: parsed.data.appId, teamId } } } } },
            }
            : { teamId };
        const [total, tags] = await prisma.$transaction([
            prisma.tag.count({ where }),
            prisma.tag.findMany({
                where,
                include: { _count: { select: { buildTags: true } } },
                orderBy: { name: "asc" },
                skip: pagination.offset,
                take: pagination.perPage,
            }),
        ]);
        const meta = buildPaginationMeta({
            page: pagination.page,
            perPage: pagination.perPage,
            total,
        });
        return reply.send({
            items: tags.map((tag) => ({
                id: tag.id,
                name: tag.name,
                usageCount: tag._count.buildTags,
            })),
            ...meta,
        });
    });
}

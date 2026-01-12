import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { resolvePagination, buildPaginationMeta } from "../lib/pagination.js";

const baseSchema = z.object({
  parentId: z.string().uuid(),
  category: z.string().trim().min(1).max(50),
});

const listQuerySchema = baseSchema.extend({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const createSchema = baseSchema.extend({
  text: z.string().trim().min(1).max(4000),
});

const ensureParentForTeam = async (category: string, parentId: string, teamId: string) => {
  if (category.toLowerCase() === "build") {
    const build = await prisma.build.findFirst({
      where: { id: parentId, version: { app: { teamId } } },
      select: { id: true },
    });
    return Boolean(build);
  }
  // Default allow for other categories when team context is present
  return true;
};

export async function commentRoutes(app: FastifyInstance) {
  app.get("/comments", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const { parentId, category } = parsed.data;
    const allowed = await ensureParentForTeam(category, parentId, teamId);
    if (!allowed) {
      return reply.status(404).send({ error: "Not found" });
    }

    const pagination = resolvePagination({
      page: parsed.data.page,
      perPage: parsed.data.perPage,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      defaultPerPage: 50,
    });

    const where = { parentId, category } as const;

    const [total, items] = await prisma.$transaction([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: pagination.offset,
        take: pagination.perPage,
        include: {
          user: { select: { id: true, username: true, email: true, fullName: true, avatarUrl: true } },
        },
      }),
    ]);

    const meta = buildPaginationMeta({ page: pagination.page, perPage: pagination.perPage, total });
    return reply.send({ items, ...meta });
  });

  app.post("/comments", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const { parentId, category, text } = parsed.data;
    const allowed = await ensureParentForTeam(category, parentId, teamId);
    if (!allowed) {
      return reply.status(404).send({ error: "Not found" });
    }

    const created = await prisma.comment.create({
      data: {
        parentId,
        category,
        text: text.trim(),
        userId: request.auth?.user.id,
      },
      include: {
        user: { select: { id: true, username: true, email: true, fullName: true, avatarUrl: true } },
      },
    });

    return reply.status(201).send(created);
  });
}

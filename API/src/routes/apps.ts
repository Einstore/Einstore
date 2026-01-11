import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";

const createAppSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export async function appRoutes(app: FastifyInstance) {
  app.post("/apps", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createAppSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
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
    const [total, items] = await prisma.$transaction([
      prisma.app.count({ where: { teamId } }),
      prisma.app.findMany({
        where: { teamId },
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

  app.get("/apps/:id", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
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

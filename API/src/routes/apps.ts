import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";

const createAppSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
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
    const items = await prisma.app.findMany({
      where: { teamId },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
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

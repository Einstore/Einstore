import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireAppForTeam } from "../lib/team-access.js";

const createVersionSchema = z.object({
  appId: z.string().uuid(),
  version: z.string().min(1),
});

const listQuerySchema = z.object({
  appId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(200).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function versionRoutes(app: FastifyInstance) {
  app.post("/versions", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createVersionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const appRecord = await requireAppForTeam(teamId, parsed.data.appId);
    if (!appRecord) {
      return reply.status(404).send({ error: "Not found" });
    }
    const created = await prisma.version.create({ data: parsed.data });
    return reply.status(201).send(created);
  });

  app.get("/versions", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const items = await prisma.version.findMany({
      where: { appId: parsed.data.appId, app: { teamId } },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });

  app.get("/versions/:id", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
    const record = await prisma.version.findFirst({
      where: { id, app: { teamId } },
      include: { builds: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.send(record);
  });
}

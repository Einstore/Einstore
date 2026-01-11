import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";

const createModuleSchema = z.object({
  buildId: z.string().uuid(),
  name: z.string().min(1),
  onDemand: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const listQuerySchema = z.object({
  buildId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function moduleRoutes(app: FastifyInstance) {
  app.post("/modules", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createModuleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const build = await requireBuildForTeam(teamId, parsed.data.buildId);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }
    const module = await prisma.module.create({
      data: {
        buildId: parsed.data.buildId,
        name: parsed.data.name,
        onDemand: parsed.data.onDemand ?? false,
        metadata: parsed.data.metadata,
      },
    });
    return reply.status(201).send(module);
  });

  app.get("/modules", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const items = await prisma.module.findMany({
      where: { buildId: parsed.data.buildId, build: { version: { app: { teamId } } } },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { name: "asc" },
    });
    return reply.send(items);
  });
}

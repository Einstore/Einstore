import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";

const createVariantSchema = z.object({
  buildId: z.string().uuid(),
  kind: z.enum(["abi", "density", "language", "device"]),
  key: z.string().min(1),
  value: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const listQuerySchema = z.object({
  buildId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function variantRoutes(app: FastifyInstance) {
  app.post("/variants", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createVariantSchema.safeParse(request.body);
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
    const variant = await prisma.variant.create({ data: parsed.data });
    return reply.status(201).send(variant);
  });

  app.get("/variants", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const items = await prisma.variant.findMany({
      where: { buildId: parsed.data.buildId, build: { version: { app: { teamId } } } },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { key: "asc" },
    });
    return reply.send(items);
  });
}

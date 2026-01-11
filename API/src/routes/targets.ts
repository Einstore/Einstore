import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";

const createTargetSchema = z.object({
  buildId: z.string().uuid(),
  platform: z.enum(["ios", "watchos", "tvos", "visionos", "android", "wearos", "auto"]),
  role: z.enum(["app", "extension", "widget", "clip", "feature"]),
  bundleId: z.string().min(1),
  hostTargetId: z.string().uuid().optional(),
  minOsVersion: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const listQuerySchema = z.object({
  buildId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

type CreateTargetInput = z.infer<typeof createTargetSchema>;

export async function targetRoutes(app: FastifyInstance) {
  app.post("/targets", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createTargetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const input: CreateTargetInput = parsed.data;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const build = await requireBuildForTeam(teamId, input.buildId);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const target = await prisma.target.create({
      data: {
        buildId: input.buildId,
        platform: input.platform,
        role: input.role,
        bundleId: input.bundleId,
        hostTargetId: input.hostTargetId,
        minOsVersion: input.minOsVersion,
        metadata: input.metadata,
      },
    });

    return reply.status(201).send(target);
  });

  app.get("/targets", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const items = await prisma.target.findMany({
      where: { buildId: parsed.data.buildId, build: { version: { app: { teamId } } } },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });
}

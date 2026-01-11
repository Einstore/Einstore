import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";
import { BuildEventKind, PlatformKind } from "@prisma/client";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const createEventSchema = z.object({
  platform: z.nativeEnum(PlatformKind).optional(),
  targetId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

type CreateEventInput = z.infer<typeof createEventSchema>;

const buildEventPayload = (
  input: CreateEventInput,
  meta: { buildId: string; teamId: string; userId?: string; ip?: string; userAgent?: string },
  kind: BuildEventKind,
) => ({
  buildId: meta.buildId,
  teamId: meta.teamId,
  userId: meta.userId,
  kind,
  platform: input.platform,
  targetId: input.targetId,
  deviceId: input.deviceId,
  ip: meta.ip,
  userAgent: meta.userAgent,
  metadata: input.metadata as Prisma.InputJsonValue | undefined,
});

export async function buildEventRoutes(app: FastifyInstance) {
  const createHandler = (kind: BuildEventKind) => async (request: any, reply: any) => {
    const parsed = createEventSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const buildId = request.params.id as string;
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

  const listHandler = (kind: BuildEventKind) => async (request: any, reply: any) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const buildId = request.params.id as string;
    const build = await requireBuildForTeam(teamId, buildId);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }
    const items = await prisma.buildEvent.findMany({
      where: { buildId, teamId, kind },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  };

  app.post("/builds/:id/downloads", { preHandler: requireTeam }, createHandler("download"));
  app.get("/builds/:id/downloads", { preHandler: requireTeam }, listHandler("download"));
  app.post("/builds/:id/installs", { preHandler: requireTeam }, createHandler("install"));
  app.get("/builds/:id/installs", { preHandler: requireTeam }, listHandler("install"));
}

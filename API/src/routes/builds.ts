import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireAppForTeam } from "../lib/team-access.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";

const createBuildSchema = z.object({
  appIdentifier: z.string().min(1),
  appName: z.string().min(1),
  version: z.string().min(1),
  buildNumber: z.string().min(1),
  displayName: z.string().min(1),
  storageKind: z.enum(["local", "s3"]),
  storagePath: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

const listQuerySchema = z.object({
  appId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

type CreateBuildInput = z.infer<typeof createBuildSchema>;

export async function buildRoutes(app: FastifyInstance) {
  app.post("/builds", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createBuildSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const input: CreateBuildInput = parsed.data;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const appRecord = await prisma.app.upsert({
      where: { teamId_identifier: { teamId, identifier: input.appIdentifier } },
      update: { name: input.appName },
      create: { identifier: input.appIdentifier, name: input.appName, teamId },
    });

    const versionRecord = await prisma.version.upsert({
      where: {
        appId_version: {
          appId: appRecord.id,
          version: input.version,
        },
      },
      update: {},
      create: {
        appId: appRecord.id,
        version: input.version,
      },
    });

    const build = await prisma.build.create({
      data: {
        versionId: versionRecord.id,
        buildNumber: input.buildNumber,
        displayName: input.displayName,
        storageKind: input.storageKind,
        storagePath: input.storagePath,
        sizeBytes: input.sizeBytes,
      },
    });

    await broadcastBadgesUpdate(teamId).catch(() => undefined);
    return reply.status(201).send(build);
  });

  app.get("/builds", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const where: { versionId?: string; version?: { app?: { teamId: string } } } = {
      version: { app: { teamId } },
    };
    if (parsed.data.versionId) {
      where.versionId = parsed.data.versionId;
    } else if (parsed.data.appId) {
      const appRecord = await requireAppForTeam(teamId, parsed.data.appId);
      if (!appRecord) {
        return reply.send([]);
      }
      const items = await prisma.build.findMany({
        where: { version: { appId: parsed.data.appId, app: { teamId } } },
        skip: parsed.data.offset,
        take: parsed.data.limit,
        orderBy: { createdAt: "desc" },
      });
      return reply.send(items);
    }

    const items = await prisma.build.findMany({
      where,
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });

  app.get("/builds/:id", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
    const record = await prisma.build.findFirst({
      where: { id, version: { app: { teamId } } },
      include: { targets: true, variants: true, modules: true, artifacts: true, signing: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.send(record);
  });
}

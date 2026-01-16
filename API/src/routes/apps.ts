import { FastifyInstance, FastifyReply } from "fastify";
import fs from "node:fs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
import { PlatformKind } from "@prisma/client";

type BillingGuard = {
  assertCanCreateApp?: (payload: { teamId: string; userId?: string; identifier?: string }) => Promise<void>;
};

const createAppSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  platform: z.nativeEnum(PlatformKind).optional(),
});

const sendBillingError = (reply: FastifyReply, error: unknown) => {
  if (!error || typeof error !== "object" || !(error as { code?: string }).code) {
    throw error;
  }
  const candidate = (error as { statusCode?: number }).statusCode;
  const statusCode = typeof candidate === "number" ? candidate : 403;
  return reply.status(statusCode).send({
    error: (error as { code: string }).code,
    message: (error as { message?: string }).message ?? "Plan limit reached.",
  });
};

export async function appRoutes(app: FastifyInstance) {
  const billingGuard = (app as { billingGuard?: BillingGuard }).billingGuard;

  app.post("/apps", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = createAppSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    if (billingGuard?.assertCanCreateApp) {
      try {
        await billingGuard.assertCanCreateApp({
          teamId,
          userId: request.auth?.user?.id,
          identifier: parsed.data.identifier,
        });
      } catch (error) {
        return sendBillingError(reply, error);
      }
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
    const where = parsed.data.platform
      ? {
          teamId,
          versions: {
            some: {
              builds: { some: { targets: { some: { platform: parsed.data.platform } } } },
            },
          },
        }
      : { teamId };
    const [total, items] = await prisma.$transaction([
      prisma.app.count({ where }),
      prisma.app.findMany({
        where,
        skip: pagination.offset,
        take: pagination.perPage,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const appIds = items.map((item) => item.id);
    const builds = appIds.length
      ? await prisma.build.findMany({
          where: { version: { appId: { in: appIds } } },
          select: {
            createdAt: true,
            version: { select: { appId: true } },
            targets: { select: { platform: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const buildList = Array.isArray(builds) ? builds : [];
    const appPlatformMap = new Map<string, PlatformKind>();
    for (const build of buildList) {
      const appId = build.version.appId;
      if (appPlatformMap.has(appId)) continue;
      const target = build.targets.find((entry) => entry.role === "app") ?? build.targets[0];
      if (target?.platform) {
        appPlatformMap.set(appId, target.platform);
      }
    }
    const meta = buildPaginationMeta({
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });
    return reply.send({
      items: items.map((item) => ({
        ...item,
        platform: appPlatformMap.get(item.id) ?? null,
      })),
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

  app.delete("/apps/:id/builds", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
    const record = await prisma.app.findFirst({
      where: { id, teamId },
      select: { id: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }

    const builds = await prisma.build.findMany({
      where: { version: { appId: id } },
      select: { id: true, storageKind: true, storagePath: true },
    });
    if (!builds.length) {
      return reply.send({ deletedBuilds: 0 });
    }

    const buildIds = builds.map((build) => build.id);
    const artifacts = await prisma.complianceArtifact.findMany({
      where: { buildId: { in: buildIds } },
      select: { storageKind: true, storagePath: true },
    });
    const targetIds = await prisma.target.findMany({
      where: { buildId: { in: buildIds } },
      select: { id: true },
    });
    const targetIdList = targetIds.map((target) => target.id);

    await prisma.$transaction([
      prisma.comment.deleteMany({
        where: { parentId: { in: buildIds }, category: "build" },
      }),
      prisma.buildEvent.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.trackingEvent.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.buildTag.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.capability.deleteMany({
        where: { targetId: { in: targetIdList } },
      }),
      prisma.target.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.variant.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.module.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.complianceArtifact.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.signingIdentity.deleteMany({
        where: { buildId: { in: buildIds } },
      }),
      prisma.build.deleteMany({
        where: { id: { in: buildIds } },
      }),
    ]);

    await Promise.all(
      [
        ...builds
          .filter((build) => build.storageKind === "local")
          .map((build) => build.storagePath),
        ...artifacts
          .filter((artifact) => artifact.storageKind === "local")
          .map((artifact) => artifact.storagePath),
      ].map((storagePath) => fs.promises.rm(storagePath, { force: true }).catch(() => undefined))
    );

    await broadcastBadgesUpdate(teamId).catch(() => undefined);

    return reply.send({ deletedBuilds: buildIds.length });
  });
}

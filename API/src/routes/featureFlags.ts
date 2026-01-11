import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireSuperUser } from "../auth/guard.js";
import { ensureFeatureFlag, isFeatureFlagEnabled } from "@rafiki270/feature-flags";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const createFlagSchema = z.object({
  key: z.string().min(1),
  description: z.string().min(1).optional(),
  defaultEnabled: z.boolean().optional(),
  metadata: z.any().optional(),
});

const updateFlagSchema = z.object({
  description: z.string().min(1).nullable().optional(),
  defaultEnabled: z.boolean().optional(),
  metadata: z.any().nullable().optional(),
});

const createOverrideSchema = z.object({
  scope: z.string().min(1),
  targetKey: z.string().min(1).nullable().optional(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  metadata: z.any().optional(),
});

const overrideQuerySchema = z.object({
  scope: z.string().min(1).optional(),
  targetKey: z.string().min(1).optional(),
});

const evaluateQuerySchema = z.object({
  scope: z.string().min(1).optional(),
  targetKey: z.string().min(1).optional(),
});

export async function featureFlagRoutes(app: FastifyInstance) {
  app.post("/feature-flags", { preHandler: requireSuperUser }, async (request, reply) => {
    const parsed = createFlagSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    const created = await ensureFeatureFlag(prisma, parsed.data.key, {
      description: parsed.data.description,
      defaultEnabled: parsed.data.defaultEnabled ?? false,
      metadata: parsed.data.metadata,
    });

    return reply.status(201).send(created);
  });

  app.get("/feature-flags", { preHandler: requireSuperUser }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const items = await prisma.featureFlag.findMany({
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });

  app.get("/feature-flags/:key", { preHandler: requireSuperUser }, async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const record = await prisma.featureFlag.findUnique({
      where: { key },
      include: { overrides: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.send(record);
  });

  app.patch("/feature-flags/:key", { preHandler: requireSuperUser }, async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const parsed = updateFlagSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        description: parsed.data.description,
        defaultEnabled: parsed.data.defaultEnabled,
        metadata: parsed.data.metadata,
      },
    });

    return reply.send(updated);
  });

  app.delete("/feature-flags/:key", { preHandler: requireSuperUser }, async (request, reply) => {
    const key = (request.params as { key: string }).key;
    try {
      const deleted = await prisma.featureFlag.delete({ where: { key } });
      return reply.send(deleted);
    } catch (error) {
      if ((error as { code?: string }).code === "P2025") {
        return reply.status(404).send({ error: "Not found" });
      }
      throw error;
    }
  });

  app.post(
    "/feature-flags/:key/overrides",
    { preHandler: requireSuperUser },
    async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const parsed = createOverrideSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    const flag = await ensureFeatureFlag(prisma, key, {});
    const targetKey = parsed.data.targetKey ?? null;
    const existing = await prisma.featureFlagOverride.findFirst({
      where: { flagId: flag.id, scope: parsed.data.scope, targetKey },
    });

    const payload = {
      enabled: parsed.data.enabled,
      rolloutPercentage: parsed.data.rolloutPercentage ?? null,
      metadata: parsed.data.metadata ?? null,
    };

    const record = existing
      ? await prisma.featureFlagOverride.update({ where: { id: existing.id }, data: payload })
      : await prisma.featureFlagOverride.create({
          data: {
            flagId: flag.id,
            scope: parsed.data.scope,
            targetKey,
            ...payload,
          },
        });

    return reply.status(201).send(record);
  });

  app.get(
    "/feature-flags/:key/overrides",
    { preHandler: requireSuperUser },
    async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const parsed = overrideQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }

    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      return reply.status(404).send({ error: "Not found" });
    }

    const where = {
      flagId: flag.id,
      ...(parsed.data.scope ? { scope: parsed.data.scope } : {}),
      ...(parsed.data.targetKey ? { targetKey: parsed.data.targetKey } : {}),
    };

    const overrides = await prisma.featureFlagOverride.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send(overrides);
  });

  app.get(
    "/feature-flags/:key/evaluate",
    { preHandler: requireSuperUser },
    async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const parsed = evaluateQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }

    const enabled = await isFeatureFlagEnabled(prisma, key, {
      scope: parsed.data.scope ?? "platform",
      targetKey: parsed.data.targetKey ?? null,
    });

    return reply.send({ key, enabled });
  });
}

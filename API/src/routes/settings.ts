import { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth, requireSuperUser } from "../auth/guard.js";
import { prisma } from "../lib/prisma.js";

const analyticsSchema = z.object({
  gaMeasurementId: z
    .string()
    .trim()
    .regex(/^G-[A-Z0-9]{8,}$/i, "Invalid Google Analytics measurement ID")
    .or(z.literal(null)),
});

const ANALYTICS_KEY = "analytics.gaMeasurementId";
const STORAGE_LIMIT_KEY = "storage.defaultLimitGb";
const DEFAULT_PER_PAGE = 25;

const storageLimitSchema = z.object({
  defaultLimitGb: z.number().positive().max(10_000),
});

const limitOverrideQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const limitOverrideSchema = z.object({
  maxUsers: z.coerce.number().int().min(0).nullable(),
  maxApps: z.coerce.number().int().min(0).nullable(),
  storageLimitBytes: z.coerce.number().int().min(0).nullable(),
  transferLimitBytes: z.coerce.number().int().min(0).nullable(),
});

const toNumberOrNull = (value: bigint | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/settings/analytics", { preHandler: requireAuth }, async (_request, reply) => {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: ANALYTICS_KEY },
    });
    const gaMeasurementId =
      typeof (setting?.value as { gaMeasurementId?: unknown } | null)?.gaMeasurementId ===
      "string"
        ? (setting?.value as { gaMeasurementId: string }).gaMeasurementId
        : null;

    return reply.send({ gaMeasurementId });
  });

  app.put(
    "/settings/analytics",
    { preHandler: requireSuperUser },
    async (request, reply) => {
      const parsed = analyticsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: "invalid_key", message: "Invalid Google Analytics key." });
      }

      const value = { gaMeasurementId: parsed.data.gaMeasurementId };
      const result = await prisma.siteSetting.upsert({
        where: { key: ANALYTICS_KEY },
        create: { key: ANALYTICS_KEY, value },
        update: { value },
      });

      const saved =
        typeof (result.value as { gaMeasurementId?: unknown } | null)?.gaMeasurementId ===
        "string"
          ? (result.value as { gaMeasurementId: string }).gaMeasurementId
          : null;

      return reply.send({ gaMeasurementId: saved });
    }
  );

  app.get("/settings/storage-limit", { preHandler: requireSuperUser }, async (_request, reply) => {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: STORAGE_LIMIT_KEY },
    });
    const defaultLimitGb =
      typeof (setting?.value as { defaultLimitGb?: unknown } | null)?.defaultLimitGb === "number"
        ? (setting?.value as { defaultLimitGb: number }).defaultLimitGb
        : 1;
    return reply.send({ defaultLimitGb });
  });

  app.put("/settings/storage-limit", { preHandler: requireSuperUser }, async (request, reply) => {
    const parsed = storageLimitSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_limit", message: "Invalid storage limit" });
    }
    const value = { defaultLimitGb: parsed.data.defaultLimitGb };
    const saved = await prisma.siteSetting.upsert({
      where: { key: STORAGE_LIMIT_KEY },
      create: { key: STORAGE_LIMIT_KEY, value },
      update: { value },
    });
    const defaultLimitGb =
      typeof (saved.value as { defaultLimitGb?: unknown } | null)?.defaultLimitGb === "number"
        ? (saved.value as { defaultLimitGb: number }).defaultLimitGb
        : parsed.data.defaultLimitGb;
    return reply.send({ defaultLimitGb });
  });

  app.get("/settings/tariff-overrides", { preHandler: requireSuperUser }, async (request, reply) => {
    const parsed = limitOverrideQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_query", message: "Invalid pagination values." });
    }

    const resolvedPerPage = parsed.data.perPage ?? parsed.data.limit ?? DEFAULT_PER_PAGE;
    const resolvedOffset = parsed.data.offset ?? (parsed.data.page ? (parsed.data.page - 1) * resolvedPerPage : 0);
    const resolvedPage = parsed.data.page ?? Math.floor(resolvedOffset / resolvedPerPage) + 1;
    const search = parsed.data.search;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined;

    const [total, teams] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: resolvedOffset,
        take: resolvedPerPage,
        include: { limitOverride: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / resolvedPerPage));
    const items = teams.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      limits: {
        maxUsers: team.limitOverride?.maxUsers ?? null,
        maxApps: team.limitOverride?.maxApps ?? null,
        storageLimitBytes: toNumberOrNull(team.limitOverride?.storageLimitBytes),
        transferLimitBytes: toNumberOrNull(team.limitOverride?.transferLimitBytes),
      },
    }));

    return reply.send({
      items,
      page: resolvedPage,
      perPage: resolvedPerPage,
      total,
      totalPages,
    });
  });

  app.put(
    "/settings/tariff-overrides/:teamId",
    { preHandler: requireSuperUser },
    async (request, reply) => {
      const teamId = (request.params as { teamId?: string })?.teamId;
      if (!teamId) {
        return reply.status(400).send({ error: "invalid_team", message: "Team id is required." });
      }
      const parsed = limitOverrideSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_limits", message: "Invalid limit overrides." });
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true, slug: true },
      });
      if (!team) {
        return reply.status(404).send({ error: "team_not_found", message: "Team not found." });
      }

      const { maxApps, maxUsers, storageLimitBytes, transferLimitBytes } = parsed.data;
      const shouldClear =
        maxApps === null &&
        maxUsers === null &&
        storageLimitBytes === null &&
        transferLimitBytes === null;

      if (shouldClear) {
        await prisma.teamLimitOverride.deleteMany({ where: { teamId } });
        return reply.send({
          id: team.id,
          name: team.name,
          slug: team.slug,
          limits: {
            maxUsers: null,
            maxApps: null,
            storageLimitBytes: null,
            transferLimitBytes: null,
          },
        });
      }

      const saved = await prisma.teamLimitOverride.upsert({
        where: { teamId },
        create: {
          teamId,
          maxUsers,
          maxApps,
          storageLimitBytes: storageLimitBytes === null ? null : BigInt(storageLimitBytes),
          transferLimitBytes: transferLimitBytes === null ? null : BigInt(transferLimitBytes),
        },
        update: {
          maxUsers,
          maxApps,
          storageLimitBytes: storageLimitBytes === null ? null : BigInt(storageLimitBytes),
          transferLimitBytes: transferLimitBytes === null ? null : BigInt(transferLimitBytes),
        },
      });

      return reply.send({
        id: team.id,
        name: team.name,
        slug: team.slug,
        limits: {
          maxUsers: saved.maxUsers ?? null,
          maxApps: saved.maxApps ?? null,
          storageLimitBytes: toNumberOrNull(saved.storageLimitBytes),
          transferLimitBytes: toNumberOrNull(saved.transferLimitBytes),
        },
      });
    }
  );
}

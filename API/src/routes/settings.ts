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

const storageLimitSchema = z.object({
  defaultLimitGb: z.number().positive().max(10_000),
});

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
}

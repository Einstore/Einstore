import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PlatformKind, TrackingService } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";

const sessionSchema = z.object({
  id: z.string().min(1).optional(),
  startedAt: z.string().datetime().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

const analyticsSchema = z.object({
  event: z.object({
    name: z.string().min(1),
    properties: z.record(z.unknown()).optional(),
  }).optional(),
  userProperties: z.record(z.unknown()).optional(),
  session: sessionSchema.optional(),
});

const errorsSchema = z.object({
  message: z.string().min(1).optional(),
  stackTrace: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

const distributionSchema = z.object({
  installSource: z.string().optional(),
  appVersion: z.string().optional(),
  buildNumber: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const deviceSchema = z.object({
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  osVersion: z.string().optional(),
  locale: z.string().optional(),
  appVersion: z.string().optional(),
  buildNumber: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const usageSchema = z.object({
  timestamp: z.string().datetime().optional(),
  timeZone: z.string().optional(),
  timeZoneOffsetMinutes: z.number().int().optional(),
  locale: z.string().optional(),
  sessionId: z.string().optional(),
  sessionDurationMs: z.number().int().nonnegative().optional(),
});

const trackingMetadataSchema = z.object({
  services: z.array(z.enum(["analytics", "errors", "distribution", "devices", "usage"])).optional(),
  analytics: analyticsSchema.optional(),
  errors: errorsSchema.optional(),
  distribution: distributionSchema.optional(),
  device: deviceSchema.optional(),
  usage: usageSchema.optional(),
  custom: z.record(z.unknown()).optional(),
});

const trackingEventBodySchema = z.object({
  platform: z.nativeEnum(PlatformKind).optional(),
  targetId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  metadata: trackingMetadataSchema.optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  perPage: z.coerce.number().int().positive().max(100).default(25).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  service: z.enum(["analytics", "errors", "distribution", "devices", "usage"]).optional(),
});

type TrackingMetadata = z.infer<typeof trackingMetadataSchema>;

const ensureServices = (meta: TrackingMetadata): TrackingService[] => {
  const fromList = meta.services ?? [];
  const inferred: string[] = [];
  if (meta.analytics) inferred.push("analytics");
  if (meta.errors) inferred.push("errors");
  if (meta.distribution) inferred.push("distribution");
  if (meta.device) inferred.push("devices");
  if (meta.usage) inferred.push("usage");
  const unique = new Set([...fromList, ...inferred]);
  return Array.from(unique).filter((value): value is TrackingService =>
    value === "analytics" ||
    value === "errors" ||
    value === "distribution" ||
    value === "devices" ||
    value === "usage"
  );
};

const parseDate = (input?: string | null) => {
  if (!input) return undefined;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export async function trackingEventRoutes(app: FastifyInstance) {
  app.post("/builds/:id/events", { preHandler: requireTeam }, async (request, reply) => {
    const buildId = (request.params as { id: string }).id;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const parsed = trackingEventBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_payload" });
    }

    const build = await requireBuildForTeam(teamId, buildId);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const meta = parsed.data.metadata ?? {};
    const services = ensureServices(meta);
    if (!services.length) {
      return reply.status(400).send({ error: "invalid_payload", message: "No services provided" });
    }

    const base = {
      buildId,
      teamId,
      userId: request.auth?.user.id,
      platform: parsed.data.platform,
      targetId: parsed.data.targetId,
      deviceId: parsed.data.deviceId,
      custom: meta.custom,
    };

    const events: Parameters<typeof prisma.trackingEvent.create>[0]["data"][] = [];
    const now = new Date();

    if (services.includes("analytics")) {
      const eventName = meta.analytics?.event?.name ?? "app_event";
      events.push({
        ...base,
        service: "analytics",
        eventName,
        eventProperties: meta.analytics?.event?.properties,
        userProperties: meta.analytics?.userProperties,
        sessionId: meta.analytics?.session?.id,
        sessionStartedAt: parseDate(meta.analytics?.session?.startedAt),
        sessionDurationMs: meta.analytics?.session?.durationMs,
        occurredAt: parseDate(meta.analytics?.session?.startedAt) ?? now,
      });
    }

    if (services.includes("errors")) {
      const message = meta.errors?.message ?? "error";
      events.push({
        ...base,
        service: "errors",
        eventName: "error",
        message,
        stackTrace: meta.errors?.stackTrace,
        eventProperties: meta.errors?.properties,
        occurredAt: now,
      });
    }

    if (services.includes("distribution")) {
      events.push({
        ...base,
        service: "distribution",
        installSource: meta.distribution?.installSource,
        appVersion: meta.distribution?.appVersion,
        buildNumber: meta.distribution?.buildNumber,
        eventProperties: meta.distribution?.metadata,
        distribution: meta.distribution,
        occurredAt: now,
      });
    }

    if (services.includes("devices")) {
      events.push({
        ...base,
        service: "devices",
        deviceModel: meta.device?.model,
        deviceManufacturer: meta.device?.manufacturer,
        deviceOsVersion: meta.device?.osVersion,
        locale: meta.device?.locale,
        deviceAppVersion: meta.device?.appVersion,
        deviceBuildNumber: meta.device?.buildNumber,
        device: meta.device,
        occurredAt: now,
      });
    }

    if (services.includes("usage")) {
      const usageTimestamp = parseDate(meta.usage?.timestamp);
      events.push({
        ...base,
        service: "usage",
        sessionId: meta.usage?.sessionId,
        sessionDurationMs: meta.usage?.sessionDurationMs,
        timeZone: meta.usage?.timeZone,
        timeZoneOffsetMinutes: meta.usage?.timeZoneOffsetMinutes,
        locale: meta.usage?.locale,
        usage: meta.usage,
        occurredAt: usageTimestamp ?? now,
      });
    }

    const created = await prisma.$transaction(
      events.map((data) => prisma.trackingEvent.create({ data })),
    );

    return reply.status(201).send({ items: created });
  });

  app.get("/builds/:id/events", { preHandler: requireTeam }, async (request, reply) => {
    const buildId = (request.params as { id: string }).id;
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const build = await requireBuildForTeam(teamId, buildId);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const parsed = listQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_query" });
    }

    const perPage = parsed.data.limit ?? parsed.data.perPage ?? 25;
    const offset = parsed.data.offset ?? 0;
    const page = parsed.data.page ?? Math.floor(offset / perPage) + 1;
    const skip = offset || (page - 1) * perPage;

    const where: any = { buildId, teamId };
    if (parsed.data.service) {
      where.service = parsed.data.service;
    }

    const [items, total] = await Promise.all([
      prisma.trackingEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.trackingEvent.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return reply.send({ items, page, perPage, total, totalPages });
  });
}

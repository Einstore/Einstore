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

const crashSchema = z.object({
  occurredAt: z.string().datetime().optional(),
  launchAt: z.string().datetime().optional(),
  foreground: z.boolean().optional(),
  exceptionType: z.string().optional(),
  signal: z.string().optional(),
  stackTrace: z.string().optional(),
  threads: z.array(z.unknown()).optional(),
  breadcrumbs: z.array(z.unknown()).optional(),
  lastScreen: z.string().optional(),
  featureFlags: z.array(z.string()).optional(),
  networkType: z.enum(["wifi", "cell", "offline", "unknown"]).optional(),
  memoryWarningCount: z.number().int().optional(),
  anrMarkers: z.array(z.string()).optional(),
  binaryHash: z.string().optional(),
  signingCertHash: z.string().optional(),
  environment: z.string().optional(),
  installSource: z.string().optional(),
  appVersion: z.string().optional(),
  buildNumber: z.string().optional(),
  custom: z.record(z.unknown()).optional(),
});

const trackingMetadataSchema = z.object({
  services: z.array(z.enum(["analytics", "errors", "distribution", "devices", "usage", "crashes"])).optional(),
  analytics: analyticsSchema.optional(),
  errors: errorsSchema.optional(),
  distribution: distributionSchema.optional(),
  device: deviceSchema.optional(),
  usage: usageSchema.optional(),
  crash: crashSchema.optional(),
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
  service: z.enum(["analytics", "errors", "distribution", "devices", "usage", "crashes"]).optional(),
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
  if (meta.crash) inferred.push("crashes");
  const unique = new Set([...fromList, ...inferred]);
  return Array.from(unique).filter((value): value is TrackingService =>
    value === "analytics" ||
    value === "errors" ||
    value === "distribution" ||
    value === "devices" ||
    value === "usage" ||
    value === "crashes"
  );
};

const parseDate = (input?: string | null) => {
  if (!input) return undefined;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const resolveBuildByTarget = async (
  teamId: string,
  platform: PlatformKind | undefined,
  targetId: string,
  meta: TrackingMetadata,
) => {
  const buildNumber = meta.distribution?.buildNumber ?? meta.device?.buildNumber ?? meta.crash?.buildNumber;
  const appVersion = meta.distribution?.appVersion ?? meta.device?.appVersion ?? meta.crash?.appVersion;
  const where: any = {
    bundleId: targetId,
    build: {
      version: { app: { teamId } },
      ...(buildNumber ? { buildNumber } : {}),
      ...(appVersion ? { version: { version: appVersion } } : {}),
    },
  };
  if (platform) {
    where.platform = platform;
  }
  const target = await prisma.target.findFirst({
    where,
    select: { buildId: true },
    orderBy: [{ build: { createdAt: "desc" } }],
  });
  return target?.buildId;
};

const buildTrackingEvents = (
  buildId: string,
  teamId: string,
  userId: string | undefined,
  parsedBody: z.infer<typeof trackingEventBodySchema>,
  meta: TrackingMetadata,
  services: TrackingService[],
) => {
  const base = {
    buildId,
    teamId,
    userId,
    platform: parsedBody.platform,
    targetId: parsedBody.targetId,
    deviceId: parsedBody.deviceId,
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

  if (services.includes("crashes")) {
    events.push({
      ...base,
      service: "crashes",
      eventName: meta.crash?.exceptionType ?? meta.crash?.signal ?? "crash",
      message: meta.crash?.exceptionType ?? meta.crash?.signal,
      stackTrace: meta.crash?.stackTrace,
      eventProperties: {
        threads: meta.crash?.threads,
        breadcrumbs: meta.crash?.breadcrumbs,
        featureFlags: meta.crash?.featureFlags,
        networkType: meta.crash?.networkType,
        memoryWarningCount: meta.crash?.memoryWarningCount,
        anrMarkers: meta.crash?.anrMarkers,
        custom: meta.crash?.custom,
        foreground: meta.crash?.foreground,
        launchAt: meta.crash?.launchAt,
        lastScreen: meta.crash?.lastScreen,
      },
      installSource: meta.crash?.installSource ?? meta.distribution?.installSource,
      appVersion: meta.crash?.appVersion ?? meta.distribution?.appVersion,
      buildNumber: meta.crash?.buildNumber ?? meta.distribution?.buildNumber,
      environment: meta.crash?.environment,
      binaryHash: meta.crash?.binaryHash,
      signingCertHash: meta.crash?.signingCertHash,
      crash: meta.crash,
      occurredAt: parseDate(meta.crash?.occurredAt) ?? now,
    });
  }

  return events;
};

export async function trackingEventRoutes(app: FastifyInstance) {
  const handleCreateEvents = async (
    request: any,
    reply: any,
    buildIdFromParams?: string,
  ) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const parsed = trackingEventBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_payload" });
    }

    const meta = parsed.data.metadata ?? {};
    const services = ensureServices(meta);
    if (!services.length) {
      return reply.status(400).send({ error: "invalid_payload", message: "No services provided" });
    }

    let buildId = buildIdFromParams;
    if (buildId) {
      const build = await requireBuildForTeam(teamId, buildId);
      if (!build) {
        return reply.status(404).send({ error: "Not found" });
      }
      buildId = build.id;
    } else if (parsed.data.targetId) {
      buildId = await resolveBuildByTarget(teamId, parsed.data.platform, parsed.data.targetId, meta);
      if (!buildId) {
        return reply.status(404).send({ error: "Not found", message: "Build not found for target" });
      }
    } else {
      return reply.status(400).send({ error: "invalid_payload", message: "Missing build or target identifier" });
    }

    const events = buildTrackingEvents(
      buildId,
      teamId,
      request.auth?.user.id,
      parsed.data,
      meta,
      services,
    );

    const created = await prisma.$transaction(
      events.map((data) => prisma.trackingEvent.create({ data })),
    );

    return reply.status(201).send({ items: created });
  };

  app.post("/builds/:id/events", { preHandler: requireTeam }, async (request, reply) => {
    const buildId = (request.params as { id: string }).id;
    return handleCreateEvents(request, reply, buildId);
  });

  app.post("/tracking/events", { preHandler: requireTeam }, async (request, reply) => {
    return handleCreateEvents(request, reply);
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

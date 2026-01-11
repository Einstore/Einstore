import { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireAppForTeam } from "../lib/team-access.js";
import { broadcastBadgesUpdate } from "../lib/realtime.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";

const groupArtifactsByKind = <T extends { kind: string; createdAt: Date }>(items: T[]) => {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    const existing = grouped[item.kind] ?? [];
    existing.push(item);
    grouped[item.kind] = existing;
  }
  for (const list of Object.values(grouped)) {
    list.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }
  return grouped;
};

type IconBitmap = {
  path: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  sourcePath?: string;
};

const storageRoot = path.resolve(process.cwd(), "storage", "ingest");

const resolveBaseUrl = (request: { headers: Record<string, string | string[] | undefined> }) => {
  const protoHeader = request.headers["x-forwarded-proto"];
  const hostHeader = request.headers["x-forwarded-host"] ?? request.headers["host"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) {
    return "http://localhost:8080";
  }
  return `${proto || "http"}://${host}`;
};

const resolveIconPath = (iconPath: string) => {
  const candidate = path.isAbsolute(iconPath) ? iconPath : path.join(storageRoot, iconPath);
  const resolved = path.resolve(candidate);
  const relative = path.relative(storageRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
};

const readIconDataUrl = async (filePath: string) => {
  const buffer = await fs.promises.readFile(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

const extractIconBitmap = (metadata: unknown): IconBitmap | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const iconBitmap = (metadata as Record<string, unknown>).iconBitmap;
  if (!iconBitmap || typeof iconBitmap !== "object" || Array.isArray(iconBitmap)) return null;
  const record = iconBitmap as Record<string, unknown>;
  const iconPath = typeof record.path === "string" ? record.path : "";
  if (!iconPath) return null;
  return {
    path: iconPath,
    width: typeof record.width === "number" ? record.width : undefined,
    height: typeof record.height === "number" ? record.height : undefined,
    sizeBytes: typeof record.sizeBytes === "number" ? record.sizeBytes : undefined,
    sourcePath: typeof record.sourcePath === "string" ? record.sourcePath : undefined,
  };
};

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
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
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
        createdByUserId: request.auth?.user.id,
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
    const pagination = resolvePagination({
      page: parsed.data.page,
      perPage: parsed.data.perPage,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    const where: { versionId?: string; version?: { app?: { teamId: string; id?: string } } } = {
      version: { app: { teamId } },
    };
    if (parsed.data.versionId) {
      where.versionId = parsed.data.versionId;
    } else if (parsed.data.appId) {
      const appRecord = await requireAppForTeam(teamId, parsed.data.appId);
      if (!appRecord) {
        const meta = buildPaginationMeta({
          page: pagination.page,
          perPage: pagination.perPage,
          total: 0,
        });
        return reply.send({ items: [], ...meta });
      }
      where.version = { app: { teamId, id: parsed.data.appId } };
    }

    const [total, items] = await prisma.$transaction([
      prisma.build.count({ where }),
      prisma.build.findMany({
        where,
        skip: pagination.offset,
        take: pagination.perPage,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const meta = buildPaginationMeta({
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });
    return reply.send({
      items,
      ...meta,
    });
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

  app.get("/builds/:id/metadata", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
    const record = await prisma.build.findFirst({
      where: { id, version: { app: { teamId } } },
      include: {
        version: { include: { app: true } },
        targets: true,
        artifacts: true,
        signing: true,
      },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    const artifactsByKind = groupArtifactsByKind(record.artifacts);
    return reply.send({ ...record, artifactsByKind });
  });

  app.get("/builds/:id/icons", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const id = (request.params as { id: string }).id;
    const record = await prisma.build.findFirst({
      where: { id, version: { app: { teamId } } },
      include: {
        version: { include: { app: true } },
        targets: true,
      },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    const baseUrl = resolveBaseUrl(request);
    const items = (
      await Promise.all(
        record.targets.map(async (target) => {
          const iconBitmap = extractIconBitmap(target.metadata);
          if (!iconBitmap) return null;
          const resolved = resolveIconPath(iconBitmap.path);
          if (!resolved || !fs.existsSync(resolved)) return null;
          return {
            targetId: target.id,
            bundleId: target.bundleId,
            platform: target.platform,
            role: target.role,
            iconBitmap: {
              width: iconBitmap.width,
              height: iconBitmap.height,
              sizeBytes: iconBitmap.sizeBytes,
              sourcePath: iconBitmap.sourcePath,
            },
            url: `${baseUrl}/builds/${record.id}/icons/${target.id}`,
            contentType: "image/png",
            dataUrl: await readIconDataUrl(resolved),
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => Boolean(item));
    return reply.send({ buildId: record.id, items });
  });

  app.get("/builds/:id/icons/:targetId", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const params = request.params as { id: string; targetId: string };
    const target = await prisma.target.findFirst({
      where: {
        id: params.targetId,
        buildId: params.id,
        build: { version: { app: { teamId } } },
      },
    });
    if (!target) {
      return reply.status(404).send({ error: "Not found" });
    }
    const iconBitmap = extractIconBitmap(target.metadata);
    if (!iconBitmap) {
      return reply.status(404).send({ error: "icon_not_found" });
    }
    const resolved = resolveIconPath(iconBitmap.path);
    if (!resolved || !fs.existsSync(resolved)) {
      return reply.status(404).send({ error: "icon_not_found" });
    }
    reply.type("image/png");
    return reply.send(fs.createReadStream(resolved));
  });
}

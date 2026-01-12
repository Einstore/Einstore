import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { buildPaginationMeta, resolvePagination } from "../lib/pagination.js";
import { normalizeTagName } from "../lib/tags.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
  appId: z.string().optional(),
  appPage: z.coerce.number().int().positive().optional(),
  appPerPage: z.coerce.number().int().min(1).max(100).optional(),
  buildPage: z.coerce.number().int().positive().optional(),
  buildPerPage: z.coerce.number().int().min(1).max(100).optional(),
  appLimit: z.coerce.number().int().min(0).max(50).optional(),
  buildLimit: z.coerce.number().int().min(0).max(50).optional(),
  appOffset: z.coerce.number().int().nonnegative().optional(),
  buildOffset: z.coerce.number().int().nonnegative().optional(),
});

export async function searchRoutes(app: FastifyInstance) {
  app.get("/search", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const { q, appId } = parsed.data;
    const normalizedQuery = normalizeTagName(q);
    const appPagination = resolvePagination({
      page: parsed.data.appPage,
      perPage: parsed.data.appPerPage ?? parsed.data.appLimit,
      limit: parsed.data.appLimit,
      offset: parsed.data.appOffset,
      defaultPerPage: 10,
      maxPerPage: 100,
    });
    const buildPagination = resolvePagination({
      page: parsed.data.buildPage,
      perPage: parsed.data.buildPerPage ?? parsed.data.buildLimit,
      limit: parsed.data.buildLimit,
      offset: parsed.data.buildOffset,
      defaultPerPage: 6,
      maxPerPage: 100,
    });

    const appWhere = {
      teamId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { identifier: { contains: q, mode: "insensitive" } },
      ],
    } as const;
    const buildWhere = {
      version: {
        app: {
          teamId,
          ...(appId ? { id: appId } : {}),
        },
      },
      OR: [
        { buildNumber: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { version: { version: { contains: q, mode: "insensitive" } } },
        { version: { app: { name: { contains: q, mode: "insensitive" } } } },
        { version: { app: { identifier: { contains: q, mode: "insensitive" } } } },
        { buildTags: { some: { tag: { normalizedName: normalizedQuery } } } },
      ],
    } as const;

    const [appTotal, apps] = await prisma.$transaction([
      prisma.app.count({ where: appWhere }),
      prisma.app.findMany({
        where: appWhere,
        orderBy: { name: "asc" },
        skip: appPagination.offset,
        take: appPagination.perPage,
      }),
    ]);

    const [buildTotal, builds] = await prisma.$transaction([
      prisma.build.count({ where: buildWhere }),
      prisma.build.findMany({
        where: buildWhere,
        orderBy: { createdAt: "desc" },
        skip: buildPagination.offset,
        take: buildPagination.perPage,
        include: {
          version: {
            include: {
              app: true,
            },
          },
        },
      }),
    ]);

    const uniqueBuilds = new Map(
      builds.map((build) => [
        build.id,
        {
          id: build.id,
          buildNumber: build.buildNumber,
          displayName: build.displayName,
          version: build.version.version,
          createdAt: build.createdAt,
          appId: build.version.app.id,
          appName: build.version.app.name,
          appIdentifier: build.version.app.identifier,
        },
      ])
    );

    const appMeta = buildPaginationMeta({
      page: appPagination.page,
      perPage: appPagination.perPage,
      total: appTotal,
    });
    const buildMeta = buildPaginationMeta({
      page: buildPagination.page,
      perPage: buildPagination.perPage,
      total: buildTotal,
    });

    return reply.send({
      apps: {
        items: apps.map((appEntry) => ({
          id: appEntry.id,
          name: appEntry.name,
          identifier: appEntry.identifier,
        })),
        ...appMeta,
      },
      builds: {
        items: Array.from(uniqueBuilds.values()).slice(0, buildPagination.perPage),
        ...buildMeta,
      },
    });
  });
}

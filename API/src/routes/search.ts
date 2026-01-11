import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
  appId: z.string().optional(),
  appLimit: z.coerce.number().int().min(0).max(50).default(10),
  buildLimit: z.coerce.number().int().min(0).max(50).default(6),
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

    const { q, appId, appLimit, buildLimit } = parsed.data;

    const apps = await prisma.app.findMany({
      where: {
        teamId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { identifier: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: appLimit,
    });

    const builds = await prisma.build.findMany({
      where: {
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
        ],
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(buildLimit * 2, buildLimit),
      include: {
        version: {
          include: {
            app: true,
          },
        },
      },
    });

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

    return reply.send({
      apps: apps.map((appEntry) => ({
        id: appEntry.id,
        name: appEntry.name,
        identifier: appEntry.identifier,
      })),
      builds: Array.from(uniqueBuilds.values()).slice(0, buildLimit),
    });
  });
}

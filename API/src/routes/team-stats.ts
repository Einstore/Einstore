import { FastifyInstance } from "fastify";
import { BuildEventKind } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export async function teamStatsRoutes(app: FastifyInstance) {
  app.get("/teams/stats", { preHandler: requireTeam }, async (request, reply) => {
    const team = request.team;
    const teamId = team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const billingCycleStart = team.billingCycleStartAt ?? team.createdAt;
    const monthStart = startOfCurrentMonth();

    const totalStorage = await prisma.build.aggregate({
      _sum: { sizeBytes: true },
      where: { version: { app: { teamId } } },
    });
    const totalStorageBytes = totalStorage._sum.sizeBytes ?? 0;

    const downloadsByBuild = await prisma.buildEvent.groupBy({
      by: ["buildId"],
      where: {
        teamId,
        kind: BuildEventKind.download,
        createdAt: { gte: monthStart },
      },
      _count: { _all: true },
    });

    const downloadBuildIds = downloadsByBuild.map((row) => row.buildId);
    const downloadBuildSizes = downloadBuildIds.length
      ? await prisma.build.findMany({
          where: { id: { in: downloadBuildIds } },
          select: { id: true, sizeBytes: true },
        })
      : [];
    const sizeByBuildId = new Map(downloadBuildSizes.map((row) => [row.id, row.sizeBytes]));

    const downloadsThisMonthCount = downloadsByBuild.reduce(
      (sum, row) => sum + row._count._all,
      0,
    );
    const downloadsThisMonthBytes = downloadsByBuild.reduce((sum, row) => {
      const buildSize = sizeByBuildId.get(row.buildId) ?? 0;
      return sum + buildSize * row._count._all;
    }, 0);

    const buildsInBillingCycle = await prisma.build.findMany({
      where: {
        createdAt: { gte: billingCycleStart },
        version: { app: { teamId } },
      },
      select: { sizeBytes: true, version: { select: { appId: true } } },
    });
    const uploadsInBillingCycleBytes = buildsInBillingCycle.reduce(
      (sum, build) => sum + build.sizeBytes,
      0,
    );
    const uploadsInBillingCycleAppCount = new Set(
      buildsInBillingCycle.map((build) => build.version.appId),
    ).size;

    return reply.send({
      billingCycleStartAt: billingCycleStart,
      totalStorageBytes,
      downloadsThisMonth: {
        from: monthStart,
        eventCount: downloadsThisMonthCount,
        bytes: downloadsThisMonthBytes,
      },
      uploadsInBillingCycle: {
        from: billingCycleStart,
        buildCount: buildsInBillingCycle.length,
        appCount: uploadsInBillingCycleAppCount,
        bytes: uploadsInBillingCycleBytes,
      },
    });
  });
}

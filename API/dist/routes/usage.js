import { prisma } from "../lib/prisma.js";
import { BuildEventKind } from "@prisma/client";
import { requireTeam } from "../auth/guard.js";
export async function usageRoutes(app) {
    app.get("/usage/storage/users", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const members = await prisma.teamMember.findMany({
            where: { teamId },
            include: { user: true },
        });
        const usageRows = await prisma.build.groupBy({
            by: ["createdByUserId"],
            where: {
                createdByUserId: { not: null },
                version: { app: { teamId } },
            },
            _count: { _all: true },
            _sum: { sizeBytes: true },
        });
        const downloadRows = await prisma.buildEvent.groupBy({
            by: ["userId", "buildId"],
            where: {
                teamId,
                kind: BuildEventKind.download,
                userId: { not: null },
            },
            _count: { _all: true },
        });
        const downloadBuildIds = downloadRows.map((row) => row.buildId);
        const downloadBuildSizes = downloadBuildIds.length
            ? await prisma.build.findMany({
                where: { id: { in: downloadBuildIds } },
                select: { id: true, sizeBytes: true },
            })
            : [];
        const sizeByBuildId = new Map(downloadBuildSizes.map((row) => [row.id, row.sizeBytes]));
        const downloadMap = new Map();
        for (const row of downloadRows) {
            if (!row.userId)
                continue;
            const sizeBytes = sizeByBuildId.get(row.buildId) ?? 0;
            const entry = downloadMap.get(row.userId) ?? { count: 0, bytes: 0 };
            entry.count += row._count._all;
            entry.bytes += sizeBytes * row._count._all;
            downloadMap.set(row.userId, entry);
        }
        const usageMap = new Map(usageRows
            .filter((row) => row.createdByUserId)
            .map((row) => [
            row.createdByUserId,
            {
                buildCount: row._count._all,
                totalBytes: row._sum.sizeBytes ?? 0,
            },
        ]));
        const results = members.map((member) => {
            const usage = usageMap.get(member.userId) ?? { buildCount: 0, totalBytes: 0 };
            const downloads = downloadMap.get(member.userId) ?? { count: 0, bytes: 0 };
            return {
                userId: member.userId,
                username: member.user.username,
                email: member.user.email ?? null,
                fullName: member.user.fullName ?? null,
                buildCount: usage.buildCount,
                totalBytes: usage.totalBytes,
                downloadCount: downloads.count,
                downloadBytes: downloads.bytes,
            };
        });
        return reply.send({ users: results });
    });
}

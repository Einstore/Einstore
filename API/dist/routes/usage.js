import { prisma } from "../lib/prisma.js";
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
            return {
                userId: member.userId,
                username: member.user.username,
                email: member.user.email ?? null,
                fullName: member.user.fullName ?? null,
                buildCount: usage.buildCount,
                totalBytes: usage.totalBytes,
            };
        });
        return reply.send({ users: results });
    });
}

import { prisma } from "./prisma.js";
export async function getTeamBadges(teamId) {
    const [apps, builds] = await prisma.$transaction([
        prisma.app.count({ where: { teamId } }),
        prisma.build.count({ where: { version: { app: { teamId } } } }),
    ]);
    return { apps, builds };
}

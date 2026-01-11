import { prisma } from "./prisma.js";

export type TeamBadges = {
  apps: number;
  builds: number;
};

export async function getTeamBadges(teamId: string): Promise<TeamBadges> {
  const [apps, builds] = await prisma.$transaction([
    prisma.app.count({ where: { teamId } }),
    prisma.build.count({ where: { version: { app: { teamId } } } }),
  ]);
  return { apps, builds };
}

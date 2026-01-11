import { prisma } from "./prisma.js";
export const requireAppForTeam = async (teamId, appId) => prisma.app.findFirst({ where: { id: appId, teamId } });
export const requireVersionForTeam = async (teamId, versionId) => prisma.version.findFirst({
    where: { id: versionId, app: { teamId } },
});
export const requireBuildForTeam = async (teamId, buildId) => prisma.build.findFirst({
    where: { id: buildId, version: { app: { teamId } } },
});

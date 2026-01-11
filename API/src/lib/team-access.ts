import { prisma } from "./prisma.js";

export const requireAppForTeam = async (teamId: string, appId: string) =>
  prisma.app.findFirst({ where: { id: appId, teamId } });

export const requireVersionForTeam = async (teamId: string, versionId: string) =>
  prisma.version.findFirst({
    where: { id: versionId, app: { teamId } },
  });

export const requireBuildForTeam = async (teamId: string, buildId: string) =>
  prisma.build.findFirst({
    where: { id: buildId, version: { app: { teamId } } },
  });

import { prisma } from "./prisma.js";

const toBigInt = (value: bigint | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return typeof value === "bigint" ? value : BigInt(value);
};

export const resolveMaxAppsOverride = async (teamId: string) => {
  const override = await prisma.teamLimitOverride.findUnique({
    where: { teamId },
    select: { maxApps: true },
  });
  return override?.maxApps ?? null;
};

export const resolveStorageLimitOverrideBytes = async (teamId: string) => {
  const override = await prisma.teamLimitOverride.findUnique({
    where: { teamId },
    select: { storageLimitBytes: true },
  });
  return toBigInt(override?.storageLimitBytes ?? null);
};

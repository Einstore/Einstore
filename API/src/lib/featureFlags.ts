import type { PrismaClient } from "@prisma/client";
import {
  ensureFeatureFlag,
  deleteFeatureFlag,
  isFeatureFlagEnabled,
  validateFeatureFlagKey,
} from "@rafiki270/feature-flags";

type FeatureFlagListOptions = {
  limit?: number;
  offset?: number;
  includeOverrides?: boolean;
};

export { ensureFeatureFlag, deleteFeatureFlag, isFeatureFlagEnabled, validateFeatureFlagKey };

export const listFeatureFlags = async (
  prisma: PrismaClient,
  options: FeatureFlagListOptions = {},
) => {
  const { limit = 20, offset = 0, includeOverrides = true } = options;
  return prisma.featureFlag.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: includeOverrides ? { overrides: true } : undefined,
  });
};

const FEATURE_FLAG_DEFAULTS: Record<string, { description?: string | null; defaultEnabled?: boolean | null }> = {};

export const resolveFeatureFlagDefaults = (key: string) => FEATURE_FLAG_DEFAULTS[key] ?? null;

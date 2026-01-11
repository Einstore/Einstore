import { ensureFeatureFlag, deleteFeatureFlag, isFeatureFlagEnabled, validateFeatureFlagKey, } from "@rafiki270/feature-flags";
export { ensureFeatureFlag, deleteFeatureFlag, isFeatureFlagEnabled, validateFeatureFlagKey };
export const listFeatureFlags = async (prisma, options = {}) => {
    const { limit = 20, offset = 0, includeOverrides = true } = options;
    return prisma.featureFlag.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: includeOverrides ? { overrides: true } : undefined,
    });
};
const FEATURE_FLAG_DEFAULTS = {};
export const resolveFeatureFlagDefaults = (key) => FEATURE_FLAG_DEFAULTS[key] ?? null;

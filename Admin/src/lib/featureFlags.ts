import { adminFeatureFlagDefinitions } from "../data/featureFlagDefinitions";

export type FeatureFlagKey =
  | "admin.overview_metrics"
  | "admin.upload_debug";

type FeatureFlagRecord = {
  key: string;
  defaultEnabled?: boolean;
};

const supportedKeys: FeatureFlagKey[] = [
  "admin.overview_metrics",
  "admin.upload_debug",
];

const defaultFeatureFlags: Record<FeatureFlagKey, boolean> = supportedKeys.reduce(
  (acc, key) => {
    const definition = adminFeatureFlagDefinitions.find((flag) => flag.key === key);
    acc[key] = definition?.defaultEnabled ?? false;
    return acc;
  },
  {} as Record<FeatureFlagKey, boolean>
);

export const buildFeatureFlagMap = (flags: FeatureFlagRecord[]) => {
  const map = { ...defaultFeatureFlags };
  flags
    .filter((flag) => supportedKeys.includes(flag.key as FeatureFlagKey))
    .forEach((flag) => {
      map[flag.key as FeatureFlagKey] = Boolean(flag.defaultEnabled);
    });
  return map;
};

export const getDefaultFeatureFlags = () => ({ ...defaultFeatureFlags });

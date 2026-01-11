import { featureFlagDefinitions } from "@rafiki270/feature-flags";

export type FeatureFlagKey =
  | "admin.overview_metrics"
  | "admin.pipeline_health"
  | "admin.activity_stream"
  | "admin.storage_usage"
  | "admin.future_flags"
  | "admin.security_posture"
  | "admin.workspace_settings";

type FeatureFlagRecord = {
  key: string;
  defaultEnabled?: boolean;
};

const defaultFeatureFlags: Record<FeatureFlagKey, boolean> = featureFlagDefinitions.reduce(
  (acc, flag) => {
    acc[flag.key as FeatureFlagKey] = flag.defaultEnabled;
    return acc;
  },
  {} as Record<FeatureFlagKey, boolean>
);

export const buildFeatureFlagMap = (flags: FeatureFlagRecord[]) => {
  const map = { ...defaultFeatureFlags };
  flags.forEach((flag) => {
    if (Object.prototype.hasOwnProperty.call(map, flag.key)) {
      map[flag.key as FeatureFlagKey] = Boolean(flag.defaultEnabled);
    }
  });
  return map;
};

export const getDefaultFeatureFlags = () => ({ ...defaultFeatureFlags });

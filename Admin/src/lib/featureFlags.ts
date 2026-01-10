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

const defaultFeatureFlags: Record<FeatureFlagKey, boolean> = {
  "admin.overview_metrics": false,
  "admin.pipeline_health": false,
  "admin.activity_stream": false,
  "admin.storage_usage": false,
  "admin.future_flags": true,
  "admin.security_posture": false,
  "admin.workspace_settings": false,
};

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

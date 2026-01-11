export type FeatureFlagDefinition = {
  key: string;
  description: string;
  defaultEnabled: boolean;
};

export const featureFlagDefinitions: FeatureFlagDefinition[] = [
  {
    key: "admin.overview_metrics",
    description: "Overview performance metrics and KPIs.",
    defaultEnabled: false,
  },
  {
    key: "admin.pipeline_health",
    description: "Pipeline health monitoring and alert cards.",
    defaultEnabled: false,
  },
  {
    key: "admin.activity_stream",
    description: "Recent activity feed for releases and builds.",
    defaultEnabled: false,
  },
  {
    key: "admin.storage_usage",
    description: "Storage usage breakdown across teams.",
    defaultEnabled: false,
  },
  {
    key: "admin.future_flags",
    description: "Feature flag management workspace.",
    defaultEnabled: false,
  },
  {
    key: "admin.security_posture",
    description: "Security posture reporting and access reviews.",
    defaultEnabled: false,
  },
  {
    key: "admin.workspace_settings",
    description: "Workspace settings and team administration.",
    defaultEnabled: false,
  },
];

export const resolveFeatureFlagDefaults = (key: string) =>
  featureFlagDefinitions.find((flag) => flag.key === key);

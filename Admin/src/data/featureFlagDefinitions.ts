export const adminFeatureFlagDefinitions = [
  {
    key: "admin.overview_metrics",
    description: "Overview performance metrics and KPIs.",
    defaultEnabled: false,
  },
  {
    key: "admin.upload_debug",
    description: "Show upload debug tools in Admin",
    defaultEnabled: false,
  },
] as const;

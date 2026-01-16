export const adminFeatureFlagDefinitions = [
  {
    key: "admin.upload_debug",
    description: "Show upload debug tools in Admin",
    defaultEnabled: false,
  },
  {
    key: "billing.priority_support",
    description: "Show Priority Support add-on in Billing",
    defaultEnabled: false,
  },
] as const;

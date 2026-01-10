declare module "@rafiki270/feature-flags" {
  type FeatureFlagOptions = {
    description?: string | null;
    defaultEnabled?: boolean;
    metadata?: unknown;
  };

  type FeatureFlagScopeOptions = FeatureFlagOptions & {
    scope?: string;
    targetKey?: string | null;
    autoCreate?: boolean;
  };

  export const FEATURE_FLAG_KEY_PATTERN: RegExp;
  export const validateFeatureFlagKey: (key: string) => boolean;
  export const ensureFeatureFlag: (prisma: unknown, key: string, options?: FeatureFlagOptions) => Promise<unknown>;
  export const isFeatureFlagEnabled: (prisma: unknown, key: string, options?: FeatureFlagScopeOptions) => Promise<boolean>;
}

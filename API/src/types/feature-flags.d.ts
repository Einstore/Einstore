declare module "@rafiki270/feature-flags" {
  export type FeatureFlag = {
    id: string;
    key: string;
    description?: string | null;
    defaultEnabled?: boolean;
    metadata?: unknown;
  };

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
  export const ensureFeatureFlag: (prisma: unknown, key: string, options?: FeatureFlagOptions) => Promise<FeatureFlag>;
  export const isFeatureFlagEnabled: (prisma: unknown, key: string, options?: FeatureFlagScopeOptions) => Promise<boolean>;
}

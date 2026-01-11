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

  export type FeatureFlagDefinition = {
    key: string;
    description: string;
    defaultEnabled: boolean;
  };

  export type FeatureFlagListOptions = {
    limit?: number;
    offset?: number;
    definitions?: FeatureFlagDefinition[];
  };

  export const FEATURE_FLAG_KEY_PATTERN: RegExp;
  export const validateFeatureFlagKey: (key: string) => boolean;
  export const featureFlagDefinitions: FeatureFlagDefinition[];
  export const resolveFeatureFlagDefaults: (key: string, definitions?: FeatureFlagDefinition[]) => FeatureFlagDefinition | undefined;
  export const ensureFeatureFlags: (prisma: unknown, definitions?: FeatureFlagDefinition[]) => Promise<void>;
  export const ensureFeatureFlag: (prisma: unknown, key: string, options?: FeatureFlagOptions) => Promise<FeatureFlag>;
  export const deleteFeatureFlag: (prisma: unknown, key: string) => Promise<FeatureFlag | null>;
  export const isFeatureFlagEnabled: (prisma: unknown, key: string, options?: FeatureFlagScopeOptions) => Promise<boolean>;
  export const listFeatureFlags: (prisma: unknown, options?: FeatureFlagListOptions) => Promise<FeatureFlag[]>;
}

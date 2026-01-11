declare module "@rafiki270/feature-flags" {
  export type FeatureFlagDefinition = {
    key: string;
    description: string;
    defaultEnabled: boolean;
  };

  export const featureFlagDefinitions: FeatureFlagDefinition[];
  export const resolveFeatureFlagDefaults: (key: string, definitions?: FeatureFlagDefinition[]) => FeatureFlagDefinition | undefined;
  export const ensureFeatureFlags: (prisma: unknown, definitions?: FeatureFlagDefinition[]) => Promise<void>;
  export const listFeatureFlags: (prisma: unknown, options?: { limit?: number; offset?: number; definitions?: FeatureFlagDefinition[] }) => Promise<unknown[]>;
  export const ensureFeatureFlag: (prisma: unknown, key: string, options?: { description?: string | null; defaultEnabled?: boolean; metadata?: unknown }) => Promise<unknown>;
  export const deleteFeatureFlag: (prisma: unknown, key: string) => Promise<unknown | null>;
  export const isFeatureFlagEnabled: (prisma: unknown, key: string, options?: { scope?: string; targetKey?: string | null; description?: string | null; defaultEnabled?: boolean; metadata?: unknown; autoCreate?: boolean }) => Promise<boolean>;
}

declare module "@rafiki270/feature-flags/admin" {
  import type { ComponentType } from "react";

  export type FeatureFlagsPageProps = {
    apiFetch: (url: string, options?: RequestInit) => Promise<unknown>;
    definitions?: { key: string; description: string; defaultEnabled: boolean }[];
    title?: string;
  };

  export const FeatureFlagsPage: ComponentType<FeatureFlagsPageProps>;
}

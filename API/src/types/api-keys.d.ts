declare module "@rafiki270/api-keys" {
  export type ApiKeyResponse = {
    id: string;
    name: string;
    type: string;
    prefix: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date | null;
    createdBy: {
      id: string;
      name: string | null;
      email: string | null;
      username: string;
    } | null;
  };

  export const resolveApiKeySecret: (options?: {
    secret?: string;
    env?: Record<string, string | undefined>;
    envKey?: string;
    fallbackEnvKeys?: string[];
    defaultSecret?: string;
  }) => string | undefined;

  export const hashApiKey: (token: string, options?: string | { secret?: string }) => string;

  export const generateApiKey: (options?: {
    prefix?: string;
    bytes?: number;
    prefixLength?: number;
    secret?: string;
  }) => {
    token: string;
    tokenHash: string;
    tokenPrefix: string;
  };

  export const buildApiKeyResponse: (record: any) => ApiKeyResponse;

  export const listApiKeys: (prisma: any, teamId: string) => Promise<any[]>;
  export const createApiKey: (
    prisma: any,
    input: {
      teamId: string;
      name: string;
      type?: string;
      createdByUserId?: string | null;
      expiresAt?: Date | null;
      prefix?: string;
      secret?: string;
    },
  ) => Promise<{ apiKey: any; token: string }>;
  export const revokeApiKey: (
    prisma: any,
    input: { id: string; teamId: string },
  ) => Promise<{ revoked: boolean; notFound?: boolean; record?: any }>;
  export const verifyApiKey: (
    prisma: any,
    token: string,
    options?: { secret?: string; touch?: boolean },
  ) => Promise<{ apiKey: any | null; error: string | null }>;
}

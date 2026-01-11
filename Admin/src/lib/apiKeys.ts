import { apiFetch } from "./api";

export type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt?: string | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
    username: string;
  } | null;
};

export type ApiKeyCreateResponse = {
  apiKey: ApiKeySummary;
  token: string;
};

export const listApiKeys = async (teamId: string) =>
  apiFetch<{ apiKeys: ApiKeySummary[] }>("/api-keys", {
    headers: { "x-team-id": teamId },
  });

export const createApiKey = async (teamId: string, name: string) =>
  apiFetch<ApiKeyCreateResponse>("/api-keys", {
    method: "POST",
    headers: { "x-team-id": teamId },
    body: JSON.stringify({ name }),
  });

export const revokeApiKey = async (teamId: string, id: string) =>
  apiFetch<{ revoked: boolean }>(`/api-keys/${id}`, {
    method: "DELETE",
    headers: { "x-team-id": teamId },
  });

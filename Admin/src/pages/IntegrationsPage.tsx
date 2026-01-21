import { useCallback, useEffect, useMemo, useState } from "react";

import ApiKeysTable, { ApiKeyRecord } from "../components/ApiKeysTable";
import IntegrationInstructions from "../components/IntegrationInstructions";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import { API_BASE_URL, apiFetch } from "../lib/api";
import type { TeamSummary } from "../lib/teams";
import { useI18n } from "../lib/i18n";

type IntegrationsPageProps = {
  teams: TeamSummary[];
  activeTeamId: string;
};

type ApiKeysResponse = {
  apiKeys: ApiKeyRecord[];
};

type CreateApiKeyResponse = {
  apiKey: ApiKeyRecord;
  token?: string;
};

const SCRIPT_URL =
  "https://raw.githubusercontent.com/Einstore/Einstore/refs/heads/main/ingest.sh";

const IntegrationsPage = ({ teams, activeTeamId }: IntegrationsPageProps) => {
  const { t } = useI18n();
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyType, setApiKeyType] = useState<"upload" | "updates">("upload");
  const [apiKeyToken, setApiKeyToken] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeyRecord | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApiKeyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [tokenById, setTokenById] = useState<Record<string, string>>({});

  const headers = useMemo(() => ({ "x-team-id": activeTeam?.id ?? "" }), [activeTeam?.id]);
  const hasTeam = Boolean(activeTeam);
  const selectedKey = useMemo(
    () => apiKeys.find((key) => key.id === selectedKeyId) ?? null,
    [apiKeys, selectedKeyId]
  );
  const selectedToken = selectedKey ? tokenById[selectedKey.id] ?? null : null;

  useEffect(() => {
    if (!activeTeam?.id) {
      setApiKeys([]);
      return;
    }
    let isMounted = true;
    setIsLoadingKeys(true);
    apiFetch<ApiKeysResponse>("/api-keys", { headers })
      .then((payload) => {
        if (isMounted) {
          setApiKeys(Array.isArray(payload?.apiKeys) ? payload.apiKeys : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiKeys([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingKeys(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeTeam?.id, headers]);

  const handleCreateApiKey = useCallback(async () => {
    if (!activeTeam?.id) return;
    const trimmed = apiKeyName.trim();
    if (!trimmed) {
      setApiKeyError(t("integrations.apiKeys.error.required", "Key name is required."));
      return;
    }
    setApiKeyError("");
    setIsCreatingKey(true);
    try {
      const payload = await apiFetch<CreateApiKeyResponse>("/api-keys", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmed, type: apiKeyType }),
      });
      setApiKeys((current) => [payload.apiKey, ...current]);
      if (payload.token) {
        setApiKeyToken(payload.token);
        setTokenById((current) => ({ ...current, [payload.apiKey.id]: payload.token }));
      }
      setSelectedKeyId(payload.apiKey.id);
      setApiKeyName("");
      setApiKeyType("upload");
    } catch {
      setApiKeyError(t("integrations.apiKeys.error.create", "Unable to create API key."));
    } finally {
      setIsCreatingKey(false);
    }
  }, [activeTeam?.id, apiKeyName, headers, t]);

  const handleConfirmRevoke = useCallback(async () => {
    if (!pendingRevoke || !activeTeam?.id) return;
    setIsRevoking(true);
    try {
      await apiFetch(`/api-keys/${pendingRevoke.id}`, {
        method: "DELETE",
        headers,
      });
      const revokedAt = new Date().toISOString();
      setApiKeys((current) =>
        current.map((key) =>
          key.id === pendingRevoke.id ? { ...key, revokedAt } : key
        )
      );
    } finally {
      setIsRevoking(false);
      setPendingRevoke(null);
    }
  }, [activeTeam?.id, headers, pendingRevoke]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || !activeTeam?.id) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api-keys/${pendingDelete.id}`, {
        method: "DELETE",
        headers,
      });
      setApiKeys((current) => current.filter((key) => key.id !== pendingDelete.id));
      if (selectedKeyId === pendingDelete.id) {
        setSelectedKeyId(null);
      }
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  }, [activeTeam?.id, headers, pendingDelete, selectedKeyId]);

  const handleCopyKey = useCallback(() => {
    if (!apiKeyToken) return;
    navigator.clipboard?.writeText(apiKeyToken).catch(() => undefined);
  }, [apiKeyToken]);

  if (!hasTeam) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">
          {t("integrations.noTeam", "Create a team to manage integrations.")}
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <Panel className="space-y-4">
            <SectionHeader
              title={t("integrations.apiKeys.create.title", "Create API key")}
              description={t("integrations.apiKeys.create.subtitle", "Keys are shown only once. Store the token securely.")}
            />
            <div>
              <label
                htmlFor="integrations-api-key"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {t("integrations.apiKeys.label", "Key name")}
              </label>
              <input
                id="integrations-api-key"
                value={apiKeyName}
                onChange={(event) => setApiKeyName(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder={t("integrations.apiKeys.placeholder", "CI uploads")}
              />
            </div>
            <div>
              <label
                htmlFor="integrations-api-key-type"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {t("integrations.apiKeys.type.label", "Key type")}
              </label>
              <select
                id="integrations-api-key-type"
                value={apiKeyType}
                onChange={(event) =>
                  setApiKeyType(event.target.value === "updates" ? "updates" : "upload")
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="upload">
                  {t("integrations.apiKeys.type.upload", "Upload builds")}
                </option>
                <option value="updates">
                  {t("integrations.apiKeys.type.updates", "Check updates")}
                </option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !apiKeyName.trim()}
              >
                {isCreatingKey
                  ? t("integrations.apiKeys.creating", "Creating...")
                  : t("integrations.apiKeys.create.cta", "Create key")}
              </button>
              <p className="text-xs text-slate-500">
                {t("integrations.apiKeys.help", "Use these tokens in CI workflows.")}
              </p>
            </div>
            {apiKeyError ? <p className="text-xs text-red-500">{apiKeyError}</p> : null}
          </Panel>

          {isLoadingKeys ? (
            <Panel>
              <p className="text-sm text-slate-500">
                {t("integrations.apiKeys.loading", "Loading API keys...")}
              </p>
            </Panel>
          ) : apiKeys.length === 0 ? (
            <Panel>
              <p className="text-sm text-slate-500">
                {t("integrations.apiKeys.empty", "No API keys yet. Create one to begin.")}
              </p>
            </Panel>
          ) : (
            <div className="space-y-2">
              <SectionHeader
                title={t("integrations.apiKeys.title", "API keys")}
                description={t("integrations.apiKeys.description", "Select a key to generate CI instructions.")}
              />
              <ApiKeysTable
                apiKeys={apiKeys}
                selectedId={selectedKeyId}
                onSelect={(key) => setSelectedKeyId(key.id)}
                onRevoke={(key) => setPendingRevoke(key)}
                onDelete={(key) => setPendingDelete(key)}
              />
            </div>
          )}
        </div>

        <IntegrationInstructions
          apiBaseUrl={API_BASE_URL}
          scriptUrl={SCRIPT_URL}
          apiKeyToken={selectedToken}
          selectedKeyName={selectedKey?.name ?? null}
          selectedKeyType={selectedKey?.type ?? null}
        />
      </div>

      {apiKeyToken ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("integrations.apiKeys.modal.title", "Copy your new API key")}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t("integrations.apiKeys.modal.subtitle", "This key will only be shown once. Store it securely.")}
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="break-all font-mono">{apiKeyToken}</span>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                onClick={handleCopyKey}
              >
                {t("common.copy", "Copy")}
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white"
                onClick={() => setApiKeyToken(null)}
              >
                {t("integrations.apiKeys.modal.confirm", "I saved it")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRevoke ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("integrations.apiKeys.revoke.title", "Revoke API key?")}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t("integrations.apiKeys.revoke.subtitle", "Revoke \"{name}\"? CI uploads using this key will stop working.", {
                name: pendingRevoke.name,
              })}
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                onClick={() => setPendingRevoke(null)}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
              >
                {isRevoking
                  ? t("integrations.apiKeys.revoke.busy", "Revoking...")
                  : t("integrations.apiKeys.revoke.cta", "Revoke key")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("integrations.apiKeys.delete.title", "Delete API key?")}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t(
                "integrations.apiKeys.delete.subtitle",
                "This will remove \"{name}\" from the list.",
                { name: pendingDelete.name }
              )}
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? t("integrations.apiKeys.delete.busy", "Deleting...")
                  : t("integrations.apiKeys.delete.cta", "Delete key")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default IntegrationsPage;

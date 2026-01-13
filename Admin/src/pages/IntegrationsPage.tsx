import { useCallback, useEffect, useMemo, useState } from "react";

import ApiKeysTable, { ApiKeyRecord } from "../components/ApiKeysTable";
import IntegrationInstructions from "../components/IntegrationInstructions";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import { API_BASE_URL, apiFetch } from "../lib/api";
import type { TeamSummary } from "../lib/teams";

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
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyToken, setApiKeyToken] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeyRecord | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
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
      setApiKeyError("Key name is required.");
      return;
    }
    setApiKeyError("");
    setIsCreatingKey(true);
    try {
      const payload = await apiFetch<CreateApiKeyResponse>("/api-keys", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmed }),
      });
      setApiKeys((current) => [payload.apiKey, ...current]);
      if (payload.token) {
        setApiKeyToken(payload.token);
        setTokenById((current) => ({ ...current, [payload.apiKey.id]: payload.token }));
      }
      setSelectedKeyId(payload.apiKey.id);
      setApiKeyName("");
    } catch {
      setApiKeyError("Unable to create API key.");
    } finally {
      setIsCreatingKey(false);
    }
  }, [activeTeam?.id, apiKeyName, headers]);

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

  const handleCopyKey = useCallback(() => {
    if (!apiKeyToken) return;
    navigator.clipboard?.writeText(apiKeyToken).catch(() => undefined);
  }, [apiKeyToken]);

  if (!hasTeam) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">Create a team to manage integrations.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500">
          Generate API keys and copy a ready-to-run CI script for build uploads.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <Panel className="space-y-4">
            <SectionHeader
              title="Create API key"
              description="Keys are shown only once. Store the token securely."
            />
            <div>
              <label
                htmlFor="integrations-api-key"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Key name
              </label>
              <input
                id="integrations-api-key"
                value={apiKeyName}
                onChange={(event) => setApiKeyName(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="CI uploads"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !apiKeyName.trim()}
              >
                {isCreatingKey ? "Creating..." : "Create key"}
              </button>
              <p className="text-xs text-slate-500">Use these tokens in CI workflows.</p>
            </div>
            {apiKeyError ? <p className="text-xs text-red-500">{apiKeyError}</p> : null}
          </Panel>

          {isLoadingKeys ? (
            <Panel>
              <p className="text-sm text-slate-500">Loading API keys...</p>
            </Panel>
          ) : apiKeys.length === 0 ? (
            <Panel>
              <p className="text-sm text-slate-500">No API keys yet. Create one to begin.</p>
            </Panel>
          ) : (
            <div className="space-y-2">
              <SectionHeader
                title="API keys"
                description="Select a key to generate CI instructions."
              />
              <ApiKeysTable
                apiKeys={apiKeys}
                selectedId={selectedKeyId}
                onSelect={(key) => setSelectedKeyId(key.id)}
                onRevoke={(key) => setPendingRevoke(key)}
              />
            </div>
          )}
        </div>

        <IntegrationInstructions
          apiBaseUrl={API_BASE_URL}
          scriptUrl={SCRIPT_URL}
          apiKeyToken={selectedToken}
          selectedKeyName={selectedKey?.name ?? null}
        />
      </div>

      {apiKeyToken ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Copy your new API key</h3>
            <p className="mt-2 text-sm text-slate-500">
              This key will only be shown once. Store it securely.
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
                Copy
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white"
                onClick={() => setApiKeyToken(null)}
              >
                I saved it
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRevoke ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Revoke API key?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Revoke "{pendingRevoke.name}"? CI uploads using this key will stop working.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                onClick={() => setPendingRevoke(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
              >
                {isRevoking ? "Revoking..." : "Revoke key"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default IntegrationsPage;

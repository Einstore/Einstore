import { useCallback, useMemo, useState, useEffect } from "react";

import ActionButton from "../components/ActionButton";
import ApiKeyRevealDialog from "../components/ApiKeyRevealDialog";
import ApiKeysTable from "../components/ApiKeysTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import Tabs from "../components/Tabs";
import TeamMembersTable from "../components/TeamMembersTable";
import TextInput from "../components/TextInput";
import { createApiKey, listApiKeys, revokeApiKey, type ApiKeySummary } from "../lib/apiKeys";
import { useAlerts } from "../lib/alerts";
import type { TeamMember, TeamSummary } from "../lib/teams";

type SettingsPageProps = {
  teams: TeamSummary[];
  activeTeamId: string;
  teamMembers: TeamMember[];
  isSaas: boolean;
  initialTab?: string;
};

const SettingsPage = ({
  teams,
  activeTeamId,
  teamMembers,
  isSaas,
  initialTab,
}: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState(initialTab ?? "team");
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyToken, setApiKeyToken] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeySummary | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const { pushAlert } = useAlerts();
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );
  const hasTeam = Boolean(activeTeam);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [activeTab, initialTab]);

  useEffect(() => {
    if (!activeTeam?.id) {
      setApiKeys([]);
      return;
    }
    let isMounted = true;
    setIsLoadingKeys(true);
    listApiKeys(activeTeam.id)
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
  }, [activeTeam?.id]);

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
      const payload = await createApiKey(activeTeam.id, trimmed);
      setApiKeys((current) => [payload.apiKey, ...current]);
      setApiKeyToken(payload.token);
      setApiKeyName("");
    } catch {
      setApiKeyError("Unable to create API key.");
    } finally {
      setIsCreatingKey(false);
    }
  }, [activeTeam?.id, apiKeyName]);

  const handleCopyKey = useCallback(() => {
    if (!apiKeyToken) return;
    navigator.clipboard
      ?.writeText(apiKeyToken)
      .then(() => {
        pushAlert({
          kind: "ok",
          message: "API key copied to clipboard.",
          durationMs: 3000,
        });
      })
      .catch(() => undefined);
  }, [apiKeyToken]);

  const handleConfirmRevoke = useCallback(async () => {
    if (!pendingRevoke || !activeTeam?.id) return;
    setIsRevoking(true);
    try {
      await revokeApiKey(activeTeam.id, pendingRevoke.id);
      const revokedAt = new Date().toISOString();
      setApiKeys((current) =>
        current.map((key) =>
          key.id === pendingRevoke.id ? { ...key, revokedAt } : key
        )
      );
    } catch {
      return;
    } finally {
      setIsRevoking(false);
      setPendingRevoke(null);
    }
  }, [activeTeam?.id, pendingRevoke]);

  const tabs = [
    {
      id: "team",
      label: "Team",
      content: hasTeam ? (
        <Panel className="space-y-6">
          <TextInput
            id="team-name"
            label="Team name"
            value={activeTeam?.name ?? ""}
            placeholder="Team name"
          />
          <TextInput
            id="team-slug"
            label="Team slug"
            value={activeTeam?.slug ?? ""}
            placeholder="team-slug"
          />
        </Panel>
      ) : (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No team is available yet.
          </p>
        </Panel>
      ),
    },
    {
      id: "users",
      label: "Users",
      content: hasTeam ? (
        <div className="space-y-4">
          <SectionHeader
            title="Team members"
            description="Users can be admins or standard users."
          />
          <TeamMembersTable members={teamMembers} />
        </div>
      ) : (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Invite teammates once you have a team.
          </p>
        </Panel>
      ),
    },
    {
      id: "api-keys",
      label: "API keys",
      content: hasTeam ? (
        <div className="space-y-4">
          <SectionHeader
            title="API keys"
            description="Create keys for CI uploads. Keys are shown only once."
          />
          <Panel className="space-y-4">
            <TextInput
              id="api-key-name"
              label="Key name"
              value={apiKeyName}
              placeholder="CI uploads"
              onChange={setApiKeyName}
            />
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton
                label={isCreatingKey ? "Creating..." : "Create key"}
                variant="primary"
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !apiKeyName.trim()}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Store the key securely. We cannot show it again.
              </p>
            </div>
            {apiKeyError ? (
              <p className="text-xs text-red-500">{apiKeyError}</p>
            ) : null}
          </Panel>
          {isLoadingKeys ? (
            <Panel>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading API keys...
              </p>
            </Panel>
          ) : (
            <ApiKeysTable keys={apiKeys} onRevoke={setPendingRevoke} />
          )}
        </div>
      ) : (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create a team to manage API keys.
          </p>
        </Panel>
      ),
    },
  ];

  if (isSaas) {
    tabs.push({
      id: "billing",
      label: "Billing",
      content: (
        <Panel>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Billing settings are available only in the SaaS version.
          </p>
        </Panel>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
      <ConfirmDialog
        isOpen={Boolean(pendingRevoke)}
        title="Revoke API key"
        description={`Revoke "${pendingRevoke?.name}"? CI uploads using this key will stop working.`}
        confirmLabel={isRevoking ? "Revoking..." : "Revoke key"}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
      <ApiKeyRevealDialog
        isOpen={Boolean(apiKeyToken)}
        token={apiKeyToken}
        onCopy={handleCopyKey}
        onClose={() => setApiKeyToken(null)}
      />
    </div>
  );
};

export default SettingsPage;

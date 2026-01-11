import { useMemo, useState, useEffect } from "react";

import { ApiKeysPanel } from "@rafiki270/api-keys/admin";

import ActionButton from "../components/ActionButton";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import Tabs from "../components/Tabs";
import TeamMembersTable from "../components/TeamMembersTable";
import TextInput from "../components/TextInput";
import { apiFetch } from "../lib/api";
import type { TeamMember, TeamSummary } from "../lib/teams";
import type { AnalyticsSettings } from "../types/settings";

const GA_KEY_PATTERN = /^G-[A-Z0-9]{8,}$/i;

type SettingsPageProps = {
  teams: TeamSummary[];
  activeTeamId: string;
  teamMembers: TeamMember[];
  isSaas: boolean;
  isSuperUser: boolean;
  initialTab?: string;
  onAnalyticsKeySaved?: (key: string | null) => void;
};

const SettingsPage = ({
  teams,
  activeTeamId,
  teamMembers,
  isSaas,
  isSuperUser,
  initialTab,
  onAnalyticsKeySaved,
}: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState(initialTab ?? "team");
  const [gaKey, setGaKey] = useState("");
  const [isSavingAnalytics, setIsSavingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsMessage, setAnalyticsMessage] = useState("");
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
    if (!isSuperUser) {
      setGaKey("");
      return;
    }
    let isMounted = true;
    apiFetch<AnalyticsSettings>("/settings/analytics")
      .then((payload) => {
        if (isMounted) {
          setGaKey(payload?.gaMeasurementId ?? "");
        }
      })
      .catch(() => {
        if (isMounted) {
          setGaKey("");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isSuperUser]);

  const handleSaveAnalytics = async () => {
    const trimmed = gaKey.trim();
    const nextValue = trimmed === "" ? null : trimmed;
    if (nextValue && !GA_KEY_PATTERN.test(nextValue)) {
      setAnalyticsError("Enter a valid GA4 measurement ID (e.g., G-XXXXXXXX).");
      setAnalyticsMessage("");
      return;
    }
    setIsSavingAnalytics(true);
    setAnalyticsError("");
    setAnalyticsMessage("");
    try {
      const payload = await apiFetch<AnalyticsSettings>("/settings/analytics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gaMeasurementId: nextValue }),
      });
      const savedKey = payload?.gaMeasurementId ?? "";
      setGaKey(savedKey ?? "");
      setAnalyticsMessage(savedKey ? "Analytics key saved." : "Analytics tracking disabled.");
      onAnalyticsKeySaved?.(payload?.gaMeasurementId ?? null);
    } catch {
      setAnalyticsError("Unable to save analytics key.");
    } finally {
      setIsSavingAnalytics(false);
    }
  };

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
        <div className="space-y-4 api-keys-page">
          <SectionHeader
            title="API keys"
            description="Create keys for CI uploads. Keys are shown only once."
          />
          <ApiKeysPanel apiFetch={apiFetch} teamId={activeTeam?.id ?? ""} />
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

  if (isSuperUser) {
    tabs.push({
      id: "analytics",
      label: "Analytics",
      content: (
        <Panel className="space-y-4">
          <SectionHeader
            title="Google Analytics"
            description="Provide a GA4 measurement ID to enable analytics across the admin. Only super users can manage this."
          />
          <div className="space-y-3">
            <TextInput
              id="ga-key"
              label="Measurement ID"
              value={gaKey}
              onChange={setGaKey}
              placeholder="G-XXXXXXXXXX"
              hint="Only GA4 measurement IDs are allowed. Leave empty to disable analytics."
            />
            {analyticsError ? (
              <p className="text-xs text-red-500">{analyticsError}</p>
            ) : null}
            {analyticsMessage ? (
              <p className="text-xs text-green-600">{analyticsMessage}</p>
            ) : null}
            <ActionButton
              label={
                isSavingAnalytics
                  ? "Saving..."
                  : gaKey.trim()
                  ? "Save analytics key"
                  : "Disable analytics"
              }
              variant="primary"
              onClick={handleSaveAnalytics}
              disabled={isSavingAnalytics}
            />
          </div>
        </Panel>
      ),
    });
  }

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
    </div>
  );
};

export default SettingsPage;

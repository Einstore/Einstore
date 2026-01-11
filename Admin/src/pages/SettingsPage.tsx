import { useMemo, useState, useEffect } from "react";

import { ApiKeysPanel } from "@rafiki270/api-keys/admin";

import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import Tabs from "../components/Tabs";
import TeamMembersTable from "../components/TeamMembersTable";
import TextInput from "../components/TextInput";
import { apiFetch } from "../lib/api";
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

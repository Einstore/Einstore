import { useMemo, useState } from "react";

import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import Tabs from "../components/Tabs";
import TeamMembersTable from "../components/TeamMembersTable";
import TextInput from "../components/TextInput";
import type { Team, TeamMember } from "../data/mock";

type SettingsPageProps = {
  teams: Team[];
  activeTeamId: string;
  teamMembers: TeamMember[];
  isSaas: boolean;
};

const SettingsPage = ({
  teams,
  activeTeamId,
  teamMembers,
  isSaas,
}: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState("team");
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || teams[0],
    [teams, activeTeamId]
  );

  const tabs = [
    {
      id: "team",
      label: "Team",
      content: (
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
      ),
    },
    {
      id: "users",
      label: "Users",
      content: (
        <div className="space-y-4">
          <SectionHeader
            title="Team members"
            description="Users can be admins or standard users."
          />
          <TeamMembersTable members={teamMembers} />
        </div>
      ),
    },
  ];

  if (isSaas) {
    tabs.push({
      id: "billing",
      label: "Billing",
      content: (
        <Panel>
          <p className="text-sm text-ink/60">
            Billing settings are available only in the SaaS version.
          </p>
        </Panel>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team settings"
        description="Manage team identity, users, and billing."
      />
      <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default SettingsPage;
